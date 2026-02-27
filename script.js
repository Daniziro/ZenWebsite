// --------- FIREBASE MODULE IMPORTS (CDN ES modules) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import {
  getFirestore, collection, doc, addDoc, deleteDoc, updateDoc, onSnapshot,
  runTransaction, serverTimestamp, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// --------- YOUR FIREBASE CONFIG (from you) ----------
const firebaseConfig = {
  apiKey: "AIzaSyA9XzO8YWtcEDG6Oqy9aUR-NONtZtyASo0",
  authDomain: "website-8b72a.firebaseapp.com",
  projectId: "website-8b72a",
  storageBucket: "website-8b72a.firebasestorage.app",
  messagingSenderId: "1068602054468",
  appId: "1:1068602054468:web:8121c2b47c0848a1f0e911",
  measurementId: "G-3S9DHP94CD"
};

const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch(e) { /* analytics optional */ }
const db = getFirestore(app);

// --------- YOUR DISCORD WEBHOOK ----------
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1476962164269908148/AgpaowygIg05V__Q6r-s_hT58fX4hynQarnYKNfeK2Jk9PEmfrULLVm_GwaHSNq7QHp9";

// --------- STATE ----------
let productsMap = new Map(); // id -> product
let currentGame = "all";
let cart = []; // items: { id, name, price }

// ADMIN password (client-side) - change to secure later
const ADMIN_PASSWORD = "1234";

// DOM refs
const productsContainer = document.getElementById("products");
const cartPanel = document.getElementById("cart-panel");
const adminPanel = document.getElementById("admin-panel");
const cartCountEl = document.getElementById("cart-count");
const heroDots = document.getElementById("hero-dots");

// ---------------- HERO / GALLERY ----------------
const heroSlides = Array.from(document.querySelectorAll(".hero-slide"));
let heroIndex = 0;
function updateHeroDots() {
  heroDots.innerHTML = "";
  heroSlides.forEach((_, i) => {
    const b = document.createElement("button");
    b.className = i === heroIndex ? "active" : "";
    b.onclick = () => {
      heroSlides[heroIndex].classList.remove("active");
      heroIndex = i;
      heroSlides[heroIndex].classList.add("active");
      updateHeroDots();
    };
    heroDots.appendChild(b);
  });
}
updateHeroDots();

setInterval(() => {
  heroSlides[heroIndex].classList.remove("active");
  heroIndex = (heroIndex + 1) % heroSlides.length;
  heroSlides[heroIndex].classList.add("active");
  updateHeroDots();
}, 4500);

// ---------------- PRODUCTS REAL-TIME ----------------
const productsCol = collection(db, "products");
// Listen to changes and keep productsMap up to date
onSnapshot(productsCol, (snapshot) => {
  snapshot.docChanges().forEach(change => {
    const id = change.doc.id;
    const data = change.doc.data();
    if (change.type === "removed") {
      productsMap.delete(id);
    } else {
      productsMap.set(id, { id, ...data });
    }
  });
  renderProducts();
  renderAdminItems();
});

// Render products filtered by currentGame
function renderProducts() {
  productsContainer.innerHTML = "";
  const products = Array.from(productsMap.values())
    .filter(p => currentGame === "all" || p.game === currentGame)
    .sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  if (products.length === 0) {
    productsContainer.innerHTML = `<div style="grid-column:1/-1;padding:30px;color:var(--muted);text-align:center">No items for this game yet.</div>`;
    return;
  }

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.game = p.game;

    card.innerHTML = `
      <img src="${p.image || 'https://picsum.photos/600/400?random=${Math.floor(Math.random()*999)}'}" alt="${escapeHtml(p.name)}">
      <h3>${escapeHtml(p.name)}</h3>
      <p class="desc">${escapeHtml(p.description || '')}</p>
      <div class="card-meta">
        <div class="price">$${Number(p.price).toFixed(2)}</div>
        <div class="card-actions">
          <button class="ghost-btn" ${p.stock <= 0 ? "disabled" : ""}>Stock: ${p.stock ?? 0}</button>
          <button class="primary-btn" ${p.stock <= 0 ? "disabled" : ""}>Add</button>
        </div>
      </div>
    `;

    // add click handlers
    card.querySelector(".primary-btn").onclick = () => addToCart(p.id, p.name, Number(p.price));
    productsContainer.appendChild(card);
  });
}

// ---------------- CART PANEL ----------------
function toggleCart(forceOpen) {
  if (typeof forceOpen === "boolean") {
    cartPanel.classList.toggle("open", forceOpen);
  } else {
    cartPanel.classList.toggle("open");
  }
}
document.getElementById("cart-btn").onclick = () => toggleCart(true);

function addToCart(id, name, price) {
  cart.push({ id, name, price });
  updateCartUI();
  showToast(`Added ${name} to cart`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function updateCartUI() {
  const cartItemsEl = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  cartItemsEl.innerHTML = "";
  let total = 0;

  cart.forEach((it, idx) => {
    total += Number(it.price);
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div>
        <div style="font-weight:600">${escapeHtml(it.name)}</div>
        <div style="color:var(--muted);font-size:13px">$${Number(it.price).toFixed(2)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <button class="ghost-btn" style="padding:4px 8px">x</button>
      </div>
    `;
    row.querySelector("button").onclick = () => removeFromCart(idx);
    cartItemsEl.appendChild(row);
  });

  cartTotalEl.innerText = `Total: $${total.toFixed(2)}`;
  cartCountEl.innerText = cart.length;
}

// ---------------- CHECKOUT (transactional stock update + webhook + order save) ----------------
document.getElementById("checkout").onclick = async () => {
  const discordUser = (document.getElementById("buyer-discord").value || "").trim();
  if (!discordUser) return alert("Please enter your Discord username (e.g. user#1234)");

  if (cart.length === 0) return alert("Cart is empty");

  // Prepare qty per product id
  const qtyMap = cart.reduce((acc, it) => {
    acc[it.id] = (acc[it.id] || 0) + 1;
    return acc;
  }, {});

  // Run transactions to decrement stock atomically for each product
  try {
    // For each product id, run transaction checking stock >= qty
    for (const [prodId, qty] of Object.entries(qtyMap)) {
      const prodRef = doc(db, "products", prodId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(prodRef);
        if (!snap.exists()) throw new Error("Product missing in database");
        const currentStock = snap.data().stock ?? 0;
        if (currentStock < qty) throw new Error(`Insufficient stock for ${snap.data().name}`);
        tx.update(prodRef, { stock: currentStock - qty });
      });
    }

    // Build order text
    let total = 0;
    let itemsText = cart.map(i => {
      total += Number(i.price);
      return `• ${i.name} - $${Number(i.price).toFixed(2)}`;
    }).join("\n");

    const orderID = "ORD-" + Math.floor(Math.random() * 1000000);

    // Send webhook
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content:
`🛒 **New Order Received**

🆔 Order ID: ${orderID}
👤 Buyer: ${discordUser}

📦 Items:
${itemsText}

💰 Total: $${total.toFixed(2)}`
      })
    });

    // Save order to Firestore 'orders' collection
    await addDoc(collection(db, "orders"), {
      orderID,
      buyer: discordUser,
      items: cart,
      total,
      createdAt: serverTimestamp()
    });

    showToast("Order placed — we will contact you on Discord");
    cart = [];
    updateCartUI();
    toggleCart(false);

  } catch (err) {
    console.error("Checkout error:", err);
    alert("Error during checkout: " + (err.message || err));
  }
};

// ---------------- ADMIN ----------------
function openAdmin() {
  const el = document.getElementById("admin-panel");
  el.classList.toggle("open");
}
async function loginAdmin() {
  const pass = document.getElementById("admin-password").value || "";
  if (pass === ADMIN_PASSWORD) {
    document.getElementById("admin-login").style.display = "none";
    document.getElementById("admin-content").style.display = "block";
    renderAdminItems(); // ensure list visible
    showToast("Admin logged in (client-side)");
  } else {
    alert("Wrong password");
  }
}

async function addItem() {
  const name = document.getElementById("item-name").value.trim();
  const description = document.getElementById("item-desc").value.trim();
  const price = Number(document.getElementById("item-price").value) || 0;
  const stock = Number(document.getElementById("item-stock").value) || 0;
  const image = document.getElementById("item-image").value.trim() || "";
  const game = document.getElementById("item-game").value || "other";

  if (!name) return alert("Name required");

  try {
    await addDoc(collection(db, "products"), {
      name, description, price, stock, image, game, createdAt: serverTimestamp()
    });
    // clear fields
    document.getElementById("item-name").value = "";
    document.getElementById("item-desc").value = "";
    document.getElementById("item-price").value = "";
    document.getElementById("item-stock").value = "";
    document.getElementById("item-image").value = "";
    showToast("Item added");
  } catch (err) {
    console.error(err);
    alert("Error adding item: " + err.message);
  }
}

function renderAdminItems() {
  const adminItems = document.getElementById("admin-items");
  adminItems.innerHTML = "";
  const list = Array.from(productsMap.values()).sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
  list.forEach(p => {
    const row = document.createElement("div");
    row.className = "admin-item";
    row.innerHTML = `
      <div style="display:flex;flex-direction:column">
        <strong>${escapeHtml(p.name)}</strong>
        <small style="color:var(--muted)">${escapeHtml(p.game)} — stock: ${p.stock ?? 0} — $${Number(p.price).toFixed(2)}</small>
      </div>
      <div style="display:flex;gap:8px">
        <button class="ghost-btn" onclick='console.log("edit not implemented")'>Edit</button>
        <button class="danger-btn" onclick="deleteItem('${p.id}')">Delete</button>
      </div>
    `;
    adminItems.appendChild(row);
  });
}

async function deleteItem(id) {
  if (!confirm("Delete this item?")) return;
  try {
    await deleteDoc(doc(db, "products", id));
    showToast("Item deleted");
  } catch (err) {
    console.error(err);
    alert("Delete failed: " + err.message);
  }
}

// ---------------- GAME FILTER UI ----------------
document.addEventListener("click", (ev) => {
  const el = ev.target;
  if (el.classList && el.classList.contains("game-btn")) {
    document.querySelectorAll(".game-btn").forEach(b => b.classList.remove("active"));
    el.classList.add("active");
    currentGame = el.dataset.game || "all";
    renderProducts();
  }
});

// ---------------- UTILITIES ----------------
function escapeHtml(s) {
  if (!s) return "";
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"', "&quot;");
}

function showToast(msg, ms = 3000) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.style.display = "block";
  clearTimeout(t._t);
  t._t = setTimeout(()=> t.style.display = "none", ms);
}

// initialize empty UI
updateCartUI();
renderAdminItems();

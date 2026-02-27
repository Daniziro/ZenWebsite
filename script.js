// script.js (module - drop into your repo replacing the current file)
// NOTE: index.html must include: <script type="module" src="script.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import {
  getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc,
  runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =======================
   YOUR FIREBASE CONFIG
   (this is the one you provided)
   ======================= */
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
try { getAnalytics(app); } catch (e) { /* optional analytics may fail in some envs */ }
const db = getFirestore(app);

/* =======================
   DISCORD WEBHOOK (you provided)
   ======================= */
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1476962164269908148/AgpaowygIg05V__Q6r-s_hT58fX4hynQarnYKNfeK2Jk9PEmfrULLVm_GwaHSNq7QHp9";

/* =======================
   CLIENT STATE
   ======================= */
let productsMap = new Map(); // id -> product object
let cart = []; // array of { id, name, price }
let currentGame = "all"; // filter

/* ADMIN - client-side password (replace or secure later) */
const ADMIN_PASSWORD = "1234";

/* =======================
   DOM HELPERS - compatible with multiple id styles
   ======================= */
function $(id1, id2) {
  // try id1 then id2, returns element or null
  return document.getElementById(id1) || (id2 ? document.getElementById(id2) : null);
}

function getEl(selector) { return document.querySelector(selector); }

/* find elements (with fallbacks in case HTML used different ids) */
const productsContainer = $("products", "itemsContainer") || document.createElement("div");
const cartPanel = $("cart-panel", "cartPanel") || document.createElement("aside");
const cartBtn = $("cart-btn", "cartBtn") || getEl(".cart-btn") || null;
const cartCountEl = $("cart-count", "cartCount") || null;
const adminToggleBtn = $("openAdminBtn", "adminBtn") || getEl(".admin-btn") || null;
const adminPanel = $("admin-panel", "adminPanel") || document.getElementById("adminPanel") || null;
const buyerDiscordInput = $("buyer-discord", "buyerDiscord") || null;
const checkoutBtn = $("checkout", "checkoutBtn") || null;
const heroSlides = Array.from(document.querySelectorAll(".hero-slide"));

/* If required DOM elements missing, log and continue so site won't crash */
if (!productsContainer) console.warn("[script.js] products container not found (expected #products or #itemsContainer).");
if (!adminPanel) console.warn("[script.js] admin panel not found (expected #admin-panel or #adminPanel).");
if (!cartPanel) console.warn("[script.js] cart panel not found (expected #cart-panel or #cartPanel).");
if (!cartBtn) console.warn("[script.js] cart open button not found (expected #cart-btn).");
if (!checkoutBtn) console.warn("[script.js] checkout button not found (expected #checkout).");
if (!buyerDiscordInput) console.warn("[script.js] buyer discord input not found (expected #buyer-discord).");

/* =======================
   RENDERING: products & admin list
   ======================= */
function renderProducts() {
  // safe guard
  if (!productsContainer) return;
  productsContainer.innerHTML = "";

  const products = Array.from(productsMap.values()).filter(p => currentGame === "all" || p.game === currentGame);

  if (products.length === 0) {
    productsContainer.innerHTML = `<div style="grid-column:1/-1;padding:24px;color:#aab">${currentGame === "all" ? "No items yet." : "No items for this game."}</div>`;
    return;
  }

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.game = p.game || "other";

    // use provided image or placeholder
    const imageUrl = p.image && p.image.length ? p.image : `https://picsum.photos/600/400?random=${Math.floor(Math.random()*999)}`;

    card.innerHTML = `
      <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(p.name)}">
      <h3>${escapeHtml(p.name)}</h3>
      <p class="desc">${escapeHtml(p.description || "")}</p>
      <div class="card-meta">
        <div class="price">$${Number(p.price).toFixed(2)}</div>
        <div class="card-actions">
          <button class="ghost-btn" ${ (p.stock <= 0) ? "disabled" : "" }>Stock: ${p.stock ?? 0}</button>
          <button class="primary-btn" ${ (p.stock <= 0) ? "disabled" : "" }>Add</button>
        </div>
      </div>
    `;

    // Add to cart handler (adds to client cart only; stock reserved at checkout)
    const addBtn = card.querySelector(".primary-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        cart.push({ id: p.id, name: p.name, price: Number(p.price) });
        updateCartUI();
        showToast(`Added ${p.name} to cart`);
      });
    }

    productsContainer.appendChild(card);
  });
}

/* Admin items list */
function renderAdminItems() {
  const adminItemsEl = document.getElementById("admin-items");
  if (!adminItemsEl) return;
  adminItemsEl.innerHTML = "";

  const list = Array.from(productsMap.values()).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  list.forEach(p => {
    const row = document.createElement("div");
    row.className = "admin-item";
    row.innerHTML = `
      <div style="display:flex;flex-direction:column">
        <strong>${escapeHtml(p.name)}</strong>
        <small style="color:var(--muted)">${escapeHtml(p.game)} • stock: ${p.stock ?? 0} • $${Number(p.price).toFixed(2)}</small>
      </div>
      <div style="display:flex;gap:8px">
        <button class="ghost-btn" title="Edit (not implemented)">Edit</button>
        <button class="danger-btn" data-id="${p.id}">Delete</button>
      </div>
    `;
    adminItemsEl.appendChild(row);
  });

  // bind delete buttons
  adminItemsEl.querySelectorAll(".danger-btn").forEach(btn => {
    btn.addEventListener("click", async (ev) => {
      const id = ev.currentTarget.dataset.id;
      if (!id) return;
      if (!confirm("Delete this item?")) return;
      try {
        await deleteDoc(doc(db, "products", id));
        showToast("Item deleted");
      } catch (err) {
        console.error("delete failed", err);
        alert("Delete failed: " + (err.message || err));
      }
    });
  });
}

/* =======================
   CART UI
   ======================= */
function updateCartUI() {
  const cartItemsEl = document.getElementById("cart-items");
  const cartTotalEl = $("cart-total", "cartTotal");
  if (!cartItemsEl || !cartTotalEl) return;

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
        <button class="ghost-btn remove-btn" data-idx="${idx}">x</button>
      </div>
    `;
    cartItemsEl.appendChild(row);
  });

  // remove handlers
  cartItemsEl.querySelectorAll(".remove-btn").forEach(b => {
    b.addEventListener("click", (ev) => {
      const i = Number(ev.currentTarget.dataset.idx);
      cart.splice(i, 1);
      updateCartUI();
    });
  });

  cartTotalEl.innerText = `Total: $${total.toFixed(2)}`;
  if (cartCountEl) cartCountEl.innerText = cart.length;
}

/* toggle cart panel */
function toggleCart(force) {
  if (!cartPanel) return;
  if (typeof force === "boolean") {
    cartPanel.classList.toggle("open", force);
  } else {
    cartPanel.classList.toggle("open");
  }
}

/* =======================
   CHECKOUT
   - runs transactions per product id to decrement stock
   - sends Discord webhook
   - saves order doc in 'orders' collection
   ======================= */
async function checkoutHandler() {
  try {
    const discordUserEl = buyerDiscordInput;
    if (!discordUserEl) { alert("Discord username field missing in DOM"); return; }
    const discordUser = (discordUserEl.value || "").trim();
    if (!discordUser) { alert("Please enter your Discord username (ex: user#1234)"); return; }
    if (cart.length === 0) { alert("Cart is empty"); return; }

    // build qty map
    const qtyMap = cart.reduce((acc, it) => { acc[it.id] = (acc[it.id] || 0) + 1; return acc; }, {});

    // run transactions for each product id
    for (const [prodId, qty] of Object.entries(qtyMap)) {
      const prodRef = doc(db, "products", prodId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(prodRef);
        if (!snap.exists()) throw new Error("Product missing: " + prodId);
        const currentStock = snap.data().stock ?? 0;
        if (currentStock < qty) throw new Error(`${snap.data().name || "Item"} has insufficient stock`);
        tx.update(prodRef, { stock: currentStock - qty });
      });
    }

    // format order
    let total = 0;
    const itemsText = cart.map(i => { total += Number(i.price); return `• ${i.name} - $${Number(i.price).toFixed(2)}`; }).join("\n");
    const orderID = "ORD-" + Math.floor(Math.random() * 1000000);

    // send webhook
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

    // save order
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
    console.error("checkout error", err);
    alert("Checkout failed: " + (err.message || err));
  }
}

/* =======================
   ADMIN: add item
   ======================= */
async function addItemHandler() {
  const nameEl = $("item-name", "itemName");
  const priceEl = $("item-price", "itemPrice");
  const imageEl = $("item-image", "itemImage");
  const gameEl = $("item-game", "gameSelectAdmin");
  const stockEl = $("item-stock", "itemStock");

  if (!nameEl || !priceEl || !imageEl || !gameEl) { alert("Admin form fields missing"); return; }

  const name = (nameEl.value || "").trim();
  const price = Number(priceEl.value) || 0;
  const image = (imageEl.value || "").trim();
  const game = (gameEl.value || "other").toLowerCase();
  const stock = (stockEl && Number(stockEl.value)) ? Number(stockEl.value) : (stockEl ? Number(stockEl.value) : 0);

  if (!name) { alert("Name required"); return; }
  try {
    await addDoc(collection(db, "products"), {
      name, description: "", price, image, game, stock, createdAt: serverTimestamp()
    });
    // clear admin inputs (if present)
    if (nameEl) nameEl.value = "";
    if (priceEl) priceEl.value = "";
    if (imageEl) imageEl.value = "";
    if (stockEl) stockEl.value = "";
    showToast("Item added");
  } catch (err) {
    console.error("add item err", err);
    alert("Add item failed: " + (err.message || err));
  }
}

/* =======================
   REAL-TIME LISTENER (products collection)
   ======================= */
(function attachProductsListener() {
  try {
    const productsCol = collection(db, "products");
    onSnapshot(productsCol, snapshot => {
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
    }, err => {
      console.error("products onSnapshot error:", err);
    });
  } catch (err) {
    console.error("attachProductsListener failed:", err);
  }
})();

/* =======================
   GAME FILTER BINDING
   ======================= */
document.addEventListener("click", (e) => {
  const el = e.target;
  if (el && el.classList && el.classList.contains("game-btn")) {
    document.querySelectorAll(".game-btn").forEach(b => b.classList.remove("active"));
    el.classList.add("active");
    currentGame = el.dataset.game || "all";
    renderProducts();
  }
});

/* =======================
   ADMIN TOGGLE & BINDINGS
   ======================= */
document.addEventListener("DOMContentLoaded", () => {
  // admin toggle (try multiple buttons)
  (adminToggleBtn || getEl("#openAdminBtn") || getEl("#adminBtn"))?.addEventListener("click", () => {
    if (!adminPanel) { console.warn("admin panel missing"); return; }
    adminPanel.classList.toggle("open");
  });

  // bind add item button (supports both ids)
  const addBtn = $("addItemBtn") || $("addItemBtn", "addItem") || getEl("#addItemBtn");
  if (addBtn) addBtn.addEventListener("click", addItemHandler);

  // admin login (if present)
  const loginBtn = getEl("#admin-login button") || getEl("#loginAdminBtn");
  if (loginBtn) loginBtn.addEventListener("click", () => {
    const passEl = $("admin-password", "adminPassword");
    if (!passEl) { alert("Admin password input missing"); return; }
    if (passEl.value === ADMIN_PASSWORD) {
      const loginBox = $("admin-login");
      const content = $("admin-content");
      if (loginBox) loginBox.style.display = "none";
      if (content) content.style.display = "block";
      renderAdminItems();
    } else alert("Wrong password");
  });

  // cart open
  if (cartBtn) cartBtn.addEventListener("click", () => toggleCart(true));

  // checkout
  if (checkoutBtn) checkoutBtn.addEventListener("click", checkoutHandler);

  // hero auto-rotation (if hero slides present)
  if (heroSlides.length) {
    let idx = 0;
    setInterval(() => {
      heroSlides.forEach(s => s.classList.remove("active"));
      idx = (idx + 1) % heroSlides.length;
      heroSlides[idx].classList.add("active");
    }, 4500);
  }
});

/* =======================
   UTILITIES
   ======================= */
function escapeHtml(s) {
  if (!s) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function showToast(msg, ms = 3000) {
  const t = document.getElementById("toast");
  if (!t) {
    console.log("toast:", msg);
    return;
  }
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(t._t);
  t._t = setTimeout(() => t.style.display = "none", ms);
}

/* initialize */
updateCartUI();
renderProducts();
renderAdminItems();

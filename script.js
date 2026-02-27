import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// FIREBASE CONFIG
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
try { getAnalytics(app); } catch { }
const db = getFirestore(app);

// DISCORD WEBHOOK
const DISCORD_WEBHOOK =
  "https://discord.com/api/webhooks/1476962164269908148/AgpaowygIg05V__Q6r-s_hT58fX4hynQarnYKNfeK2Jk9PEmfrULLVm_GwaHSNq7QHp9";

let cart = [];
let productsMap = new Map();
let currentGame = "all";

// RENDER PRODUCTS
function renderProducts() {
  const container = document.getElementById("products");
  if (!container) return;
  container.innerHTML = "";

  Array.from(productsMap.values())
    .filter(p => currentGame === "all" || p.game === currentGame)
    .forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.image || "https://picsum.photos/600/400"}">
        <h3>${p.name}</h3>
        <div class="card-meta">
          <div class="price">$${Number(p.price).toFixed(2)}</div>
          <button class="primary-btn">Add</button>
        </div>
      `;
      card.querySelector("button").onclick = () => {
        cart.push(p);
        updateCart();
      };
      container.appendChild(card);
    });
}

// REALTIME FIRESTORE
onSnapshot(collection(db, "products"), snapshot => {
  productsMap.clear();
  snapshot.forEach(d => productsMap.set(d.id, { id: d.id, ...d.data() }));
  renderProducts();
  renderAdminItems();
});

// ADMIN AUTH
function loginAdmin() {
  if (document.getElementById("admin-password").value === "1234") {
    document.getElementById("admin-login").style.display = "none";
    document.getElementById("admin-content").style.display = "block";
  } else alert("Wrong password");
}
window.loginAdmin = loginAdmin;

// ADD ITEM
async function addItem() {
  const name = document.getElementById("item-name").value;
  const price = document.getElementById("item-price").value;
  const image = document.getElementById("item-image").value;
  const game = document.getElementById("item-game").value;
  const stock = Number(document.getElementById("item-stock").value);

  if (!name || !price) return alert("Name & price required");

  try {
    await addDoc(collection(db, "products"), {
      name,
      price: Number(price),
      image,
      game,
      stock,
      createdAt: serverTimestamp()
    });
    alert("Item added!");
  } catch (err) {
    console.error(err);
    alert("Error adding item: " + err.message);
  }
}
window.addItem = addItem;

// ADMIN ITEMS LIST
function renderAdminItems() {
  const adminItems = document.getElementById("admin-items");
  if (!adminItems) return;
  adminItems.innerHTML = "";
  Array.from(productsMap.values())
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .forEach(p => {
      const row = document.createElement("div");
      row.className = "admin-item";
      row.innerHTML = `
        <div>
          <strong>${p.name}</strong> • ${p.game} • $${p.price} • stock: ${p.stock}
        </div>
        <button class="danger-btn">Delete</button>
      `;
      row.querySelector("button").onclick = async () => {
        await deleteDoc(doc(db, "products", p.id));
      };
      adminItems.appendChild(row);
    });
}

// CART
function updateCart() {
  const cartItemsEl = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  const cartCountEl = document.getElementById("cart-count");

  cartItemsEl.innerHTML = "";
  let total = 0;

  cart.forEach(i => {
    total += Number(i.price);
    cartItemsEl.innerHTML += `<div class="cart-item">${i.name} - $${i.price}</div>`;
  });

  cartTotalEl.innerText = "Total: $" + total.toFixed(2);
  cartCountEl.innerText = cart.length;
}

window.toggleCart = () => {
  document.getElementById("cart-panel").classList.toggle("open");
};

window.toggleAdmin = () => {
  document.getElementById("admin-panel").classList.toggle("open");
};

// CHECKOUT
async function checkout() {
  const discordUser = document.getElementById("buyer-discord").value.trim();
  if (!discordUser) return alert("Enter Discord username");
  if (cart.length === 0) return alert("Cart empty");

  let total = 0;
  const itemsText = cart.map(i => {
    total += Number(i.price);
    return `• ${i.name} - $${i.price}`;
  }).join("\n");

  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content:
        `🛒 NEW ORDER\nDiscord: ${discordUser}\n\n${itemsText}\n\nTotal: $${total.toFixed(2)}`
    })
  });

  alert("Order sent!");
  cart = [];
  updateCart();
}
window.checkout = checkout;

// GAME FILTER
document.addEventListener("click", e => {
  if (e.target.classList.contains("game-btn")) {
    document.querySelectorAll(".game-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    currentGame = e.target.dataset.game;
    renderProducts();
  }
});

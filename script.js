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

/* ================= FIREBASE ================= */

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
getAnalytics(app);
const db = getFirestore(app);

/* ================= DISCORD WEBHOOK ================= */

const DISCORD_WEBHOOK =
  "https://discord.com/api/webhooks/1476962164269908148/AgpaowygIg05V__Q6r-s_hT58fX4hynQarnYKNfeK2Jk9PEmfrULLVm_GwaHSNq7QHp9";

/* ================= STATE ================= */

let productsMap = new Map();
let cart = [];
let currentGame = "all";

/* ================= RENDER PRODUCTS ================= */

function renderProducts() {
  const container = document.getElementById("products");
  if (!container) return;

  container.innerHTML = "";

  const list = Array.from(productsMap.values()).filter(
    p => currentGame === "all" || p.game === currentGame
  );

  list.forEach(p => {
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

    card.querySelector(".primary-btn").addEventListener("click", () => {
      cart.push(p);
      updateCart();
    });

    container.appendChild(card);
  });
}

/* ================= REALTIME FIRESTORE ================= */

onSnapshot(collection(db, "products"), snapshot => {
  productsMap.clear();
  snapshot.forEach(docSnap => {
    productsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
  });
  renderProducts();
});

/* ================= ADMIN ADD ITEM ================= */

async function addItem() {
  const name = document.getElementById("item-name")?.value;
  const price = document.getElementById("item-price")?.value;
  const image = document.getElementById("item-image")?.value;
  const game = document.getElementById("item-game")?.value;
  const stock = document.getElementById("item-stock")?.value;

  if (!name || !price) {
    alert("Name and price required");
    return;
  }

  try {
    await addDoc(collection(db, "products"), {
      name,
      price: Number(price),
      image: image || "",
      game: game || "other",
      stock: Number(stock) || 0,
      createdAt: serverTimestamp()
    });

    alert("Item added!");
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
}

/* 🔥 MAKE GLOBAL FOR onclick */
window.addItem = addItem;

/* ================= CART ================= */

function updateCart() {
  const cartItems = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const countEl = document.getElementById("cart-count");

  if (!cartItems || !totalEl) return;

  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    total += Number(item.price);

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div>${item.name}</div>
      <div>$${Number(item.price).toFixed(2)}</div>
    `;
    cartItems.appendChild(div);
  });

  totalEl.innerText = "Total: $" + total.toFixed(2);
  if (countEl) countEl.innerText = cart.length;
}

/* ================= CHECKOUT ================= */

async function checkout() {
  const discordUser = document.getElementById("buyer-discord")?.value;

  if (!discordUser) {
    alert("Enter Discord username");
    return;
  }

  if (cart.length === 0) {
    alert("Cart empty");
    return;
  }

  let total = 0;
  const itemsText = cart
    .map(i => {
      total += Number(i.price);
      return `• ${i.name} - $${Number(i.price).toFixed(2)}`;
    })
    .join("\n");

  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `🛒 NEW ORDER\nUser: ${discordUser}\n\n${itemsText}\n\nTotal: $${total.toFixed(
        2
      )}`
    })
  });

  await addDoc(collection(db, "orders"), {
    buyer: discordUser,
    items: cart,
    total,
    createdAt: serverTimestamp()
  });

  alert("Order sent!");
  cart = [];
  updateCart();
}

/* 🔥 MAKE GLOBAL */
window.checkout = checkout;

/* ================= ADMIN PANEL TOGGLE ================= */

function toggleAdmin() {
  const panel = document.getElementById("admin-panel");
  if (panel) panel.classList.toggle("open");
}

window.toggleAdmin = toggleAdmin;

/* ================= CART TOGGLE ================= */

function toggleCart() {
  const panel = document.getElementById("cart-panel");
  if (panel) panel.classList.toggle("open");
}

window.toggleCart = toggleCart;

/* ================= GAME FILTER ================= */

document.addEventListener("click", e => {
  if (e.target.classList.contains("game-btn")) {
    document.querySelectorAll(".game-btn").forEach(b =>
      b.classList.remove("active")
    );
    e.target.classList.add("active");
    currentGame = e.target.dataset.game;
    renderProducts();
  }
});

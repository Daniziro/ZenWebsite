// ===============================
// 🔥 FIREBASE IMPORTS
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===============================
// 🔥 YOUR FIREBASE CONFIG
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyA9XzO8YWtcEDG6Oqy9aUR-NONtZtyASo0",
  authDomain: "website-8b72a.firebaseapp.com",
  projectId: "website-8b72a",
  storageBucket: "website-8b72a.firebasestorage.app",
  messagingSenderId: "1068602054468",
  appId: "1:1068602054468:web:8121c2b47c0848a1f0e911",
  measurementId: "G-3S9DHP94CD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// ===============================
// 🔐 YOUR DISCORD WEBHOOK
// ===============================
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1476962164269908148/AgpaowygIg05V__Q6r-s_hT58fX4hynQarnYKNfeK2Jk9PEmfrULLVm_GwaHSNq7QHp9";

// ===============================
// 🛒 CART SYSTEM
// ===============================
let cart = [];

function addToCart(name, price) {
  cart.push({ name, price });
  updateCart();
}

function updateCart() {
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");

  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    total += Number(item.price);
    cartItems.innerHTML += `<p>${item.name} - $${item.price}</p>`;
  });

  cartTotal.innerText = "Total: $" + total;
}

// ===============================
// 💳 CHECKOUT
// ===============================
document.getElementById("checkout").onclick = async () => {

  const discordUser = document.getElementById("buyer-discord").value.trim();

  if (cart.length === 0) {
    return alert("Cart is empty");
  }

  if (discordUser === "") {
    return alert("Please enter your Discord username.");
  }

  let total = 0;
  let itemsText = cart.map(i => {
    total += Number(i.price);
    return `• ${i.name} - $${i.price}`;
  }).join("\n");

  const orderID = "ORD-" + Math.floor(Math.random() * 1000000);

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

💰 Total: $${total}`
    })
  });

  alert("Order sent! We will contact you on Discord.");

  cart = [];
  document.getElementById("buyer-discord").value = "";
  updateCart();
};

// ===============================
// 📦 LOAD PRODUCTS FROM FIRESTORE
// ===============================
async function loadProducts() {
  const productsContainer = document.querySelector(".products");
  productsContainer.innerHTML = "";

  const snapshot = await getDocs(collection(db, "products"));

  snapshot.forEach(doc => {
    const product = doc.data();

    const productDiv = document.createElement("div");
    productDiv.className = "product-card";
    productDiv.dataset.game = product.game;

    productDiv.innerHTML = `
      <img src="${product.image}">
      <h3>${product.name}</h3>
      <p>$${product.price}</p>
      <button>Add to Cart</button>
    `;

    productDiv.querySelector("button").onclick = () =>
      addToCart(product.name, product.price);

    productsContainer.appendChild(productDiv);
  });
}

loadProducts();

// ===============================
// 🎮 GAME FILTER
// ===============================
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("game-btn")) {

    document.querySelectorAll(".game-btn")
      .forEach(btn => btn.classList.remove("active"));

    e.target.classList.add("active");

    const selectedGame = e.target.dataset.game;

    document.querySelectorAll(".product-card")
      .forEach(product => {
        if (selectedGame === "all" || product.dataset.game === selectedGame) {
          product.style.display = "block";
        } else {
          product.style.display = "none";
        }
      });
  }
});

// ===============================
// 🖼 ROTATING FEATURE IMAGES
// ===============================
const images1 = [
  "https://picsum.photos/300/200?random=11",
  "https://picsum.photos/300/200?random=12",
  "https://picsum.photos/300/200?random=13"
];

const images2 = [
  "https://picsum.photos/300/200?random=21",
  "https://picsum.photos/300/200?random=22",
  "https://picsum.photos/300/200?random=23"
];

let index1 = 0;
let index2 = 0;

setInterval(() => {
  const img1 = document.getElementById("feature-img-1");
  if (img1) {
    index1 = (index1 + 1) % images1.length;
    img1.src = images1[index1];
  }
}, 3000);

setInterval(() => {
  const img2 = document.getElementById("feature-img-2");
  if (img2) {
    index2 = (index2 + 1) % images2.length;
    img2.src = images2[index2];
  }
}, 4000);

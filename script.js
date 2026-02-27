// 🔥 Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA9XzO8YWtcEDG6Oqy9aUR-NONtZtyASo0",
  authDomain: "website-8b72a.firebaseapp.com",
  projectId: "website-8b72a",
  storageBucket: "website-8b72a.firebasestorage.app",
  messagingSenderId: "1068602054468",
  appId: "1:1068602054468:web:8121c2b47c0848a1f0e911",
  measurementId: "G-3S9DHP94CD"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const ADMIN_PASSWORD = "1234"; // change this
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1476962164269908148/AgpaowygIg05V__Q6r-s_hT58fX4hynQarnYKNfeK2Jk9PEmfrULLVm_GwaHSNq7QHp9";

let cart = [];

const container = document.getElementById("items-container");
const cartPanel = document.getElementById("cart-panel");
const adminPanel = document.getElementById("admin-panel");

// 🔥 Real-time listener
function renderItems() {
  db.collection("items").onSnapshot(snapshot => {
    container.innerHTML = "";

    snapshot.forEach(doc => {
      const item = doc.data();

      container.innerHTML += `
        <div class="item-card">
          <img src="${item.image}">
          <h3>${item.name}</h3>
          <p>${item.description}</p>
          <div class="price">$${item.price}</div>
          <div>Stock: ${item.stock}</div>
          <button onclick="addToCart('${doc.id}', ${item.price}, '${item.name}', ${item.stock})"
            ${item.stock <= 0 ? "disabled" : ""}>
            ${item.stock <= 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      `;
    });
  });
}

function addToCart(id, price, name, stock) {
  if (stock <= 0) return;

  cart.push({ id, price, name });

  db.collection("items").doc(id).update({
    stock: firebase.firestore.FieldValue.increment(-1)
  });

  updateCart();
}

function updateCart() {
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const cartCount = document.getElementById("cart-count");

  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    total += item.price;
    cartItems.innerHTML += `<div>${item.name} - $${item.price}</div>`;
  });

  cartTotal.innerText = "Total: $" + total;
  cartCount.innerText = cart.length;
}

document.getElementById("cart-btn").onclick = () => {
  cartPanel.classList.toggle("open");
};

function openAdmin() {
  adminPanel.classList.toggle("open");
}

function loginAdmin() {
  const pass = document.getElementById("admin-password").value;

  if (pass === ADMIN_PASSWORD) {
    document.getElementById("admin-login").style.display = "none";
    document.getElementById("admin-content").style.display = "block";
  } else {
    alert("Wrong password");
  }
}

function addItem() {
  const newItem = {
    name: document.getElementById("item-name").value,
    description: document.getElementById("item-desc").value,
    price: parseFloat(document.getElementById("item-price").value),
    stock: parseInt(document.getElementById("item-stock").value),
    image: document.getElementById("item-image").value
  };

  db.collection("items").add(newItem);
}

// 🔥 Checkout with Discord webhook
document.getElementById("checkout").onclick = async () => {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  let total = 0;
  let orderText = cart.map(item => {
    total += item.price;
    return `${item.name} - $${item.price}`;
  }).join("\n");

  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `🛒 **New Order Received**\n\n${orderText}\n\n💰 Total: $${total}`
    })
  });

  alert("Order sent successfully!");

  cart = [];
  updateCart();
};

renderItems();

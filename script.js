// ==========================
// 🔥 FIREBASE CONFIG
// ==========================
const firebaseConfig = {
  apiKey: "AIzaSyA9XzO8YWtcEDG6Oqy9aUR-NONtZtyASo0Y",
  authDomain: "website-8b72a.firebaseapp.com",
  projectId: "website-8b72a",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================
// 🔥 DISCORD WEBHOOK
// ==========================
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1476962164269908148/AgpaowygIg05V__Q6r-s_hT58fX4hynQarnYKNfeK2Jk9PEmfrULLVm_GwaHSNq7QHp9";

// ==========================
// 🔥 ROTATING TEXT
// ==========================
const texts = ["Digital Assets", "Premium Accounts", "Limited Stock"];
let index = 0;

setInterval(() => {
  index = (index + 1) % texts.length;
  document.getElementById("rotating-text").textContent = texts[index];
}, 2500);

// ==========================
// 🔥 PANEL TOGGLES
// ==========================
function toggleAdmin() {
  document.getElementById("admin-panel").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("active");
}

function toggleCart() {
  document.getElementById("cart-panel").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("active");
}

document.getElementById("overlay").addEventListener("click", closePanels);

function closePanels() {
  document.getElementById("admin-panel").classList.remove("open");
  document.getElementById("cart-panel").classList.remove("open");
  document.getElementById("overlay").classList.remove("active");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePanels();
});

// ==========================
// 🔥 ADD PRODUCT (FIREBASE)
// ==========================
function addProduct() {
  const name = document.getElementById("name").value;
  const price = document.getElementById("price").value;
  const image = document.getElementById("image").value;

  if (!name || !price || !image) {
    alert("Fill all fields");
    return;
  }

  db.collection("products").add({
    name,
    price,
    image,
    createdAt: new Date()
  }).then(() => {
    alert("Product added");
    document.getElementById("name").value = "";
    document.getElementById("price").value = "";
    document.getElementById("image").value = "";
  });
}

// ==========================
// 🔥 LOAD PRODUCTS
// ==========================
function loadProducts() {
  db.collection("products").orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {

      const container = document.getElementById("products");
      container.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();

        container.innerHTML += `
          <div class="card">
            <img src="${data.image}">
            <div class="card-content">
              <h3>${data.name}</h3>
              <p>$${data.price}</p>
              <button onclick="addToCart('${data.name}', '${data.price}')">
                Add to Cart
              </button>
            </div>
          </div>
        `;
      });
    });
}

loadProducts();

// ==========================
// 🔥 CART SYSTEM
// ==========================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(name, price) {
  cart.push({ name, price });
  saveCart();
  updateCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCart();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCart() {
  document.getElementById("cart-count").textContent = cart.length;

  const cartItems = document.getElementById("cart-items");
  cartItems.innerHTML = "";

  cart.forEach((item, i) => {
    cartItems.innerHTML += `
      <div style="margin-bottom:10px;">
        ${item.name} - $${item.price}
        <button onclick="removeFromCart(${i})"
          style="background:red;border:none;color:white;padding:3px 6px;border-radius:4px;cursor:pointer;">
          X
        </button>
      </div>
    `;
  });
}

updateCart();

// ==========================
// 🔥 SEND ORDER TO DISCORD
// ==========================
function sendOrderToDiscord() {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const orderList = cart.map(item => `• ${item.name} - $${item.price}`).join("\n");

  fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: "ZEUS STOCK",
      embeds: [
        {
          title: "🛒 New Order",
          description: orderList,
          color: 5814783,
          footer: {
            text: "Premium Marketplace"
          },
          timestamp: new Date()
        }
      ]
    })
  }).then(() => {
    alert("Order sent to Discord!");
    cart = [];
    saveCart();
    updateCart();
    closePanels();
  }).catch(err => {
    console.error(err);
    alert("Failed to send order");
  });
}

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA9XzO8YWtcEDG6Oqy9aUR-NONtZtyASo0",
  authDomain: "website-8b72a.firebaseapp.com",
  projectId: "website-8b72a",
  storageBucket: "website-8b72a.firebasestorage.app",
  messagingSenderId: "1068602054468",
  appId: "1:1068602054468:web:8121c2b47c0848a1f0e911"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const ADMIN_PASSWORD = "1234";
const DISCORD_WEBHOOK = "YOUR_WEBHOOK_HERE";

let cart = [];
let currentGame = "bloodlines";

const container = document.getElementById("items-container");
const cartPanel = document.getElementById("cart-panel");

/* ROTATING HERO */
/* HERO IMAGE ROTATION */
let heroSlides = document.querySelectorAll(".hero-slide");
let heroIndex = 0;

setInterval(() => {
  heroSlides[heroIndex].classList.remove("active");
  heroIndex = (heroIndex + 1) % heroSlides.length;
  heroSlides[heroIndex].classList.add("active");
}, 4000);

/* LOAD ITEMS */
function renderItems() {
  db.collection("items")
    .where("game", "==", currentGame)
    .onSnapshot(snapshot => {
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

function loadGame(game) {
  currentGame = game;
  renderItems();
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

document.getElementById("checkout").onclick = async () => {
  if (cart.length === 0) return alert("Cart empty");

  let total = 0;
  let text = cart.map(i => {
    total += i.price;
    return `${i.name} - $${i.price}`;
  }).join("\n");

  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `🛒 New Order\n\n${text}\n\nTotal: $${total}`
    })
  });

  alert("Order sent!");
  cart = [];
  updateCart();
};

/* ADMIN */
function openAdmin() {
  document.getElementById("admin-panel").classList.toggle("open");
}

function loginAdmin() {
  if (document.getElementById("admin-password").value === ADMIN_PASSWORD) {
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
    image: document.getElementById("item-image").value,
    game: document.getElementById("item-game").value
  };

  db.collection("items").add(newItem)
    .then(() => alert("Item added"))
    .catch(err => alert(err.message));
}

renderItems();


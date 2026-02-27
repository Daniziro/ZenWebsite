import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9XzO8YWtcEDG6Oqy9aUR-NONtZtyASo0",
  authDomain: "website-8b72a.firebaseapp.com",
  projectId: "website-8b72a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const webhook = "https://discord.com/api/webhooks/1476962164269908148/AgpaowygIg05V__Q6r-s_hT58fX4hynQarnYKNfeK2Jk9PEmfrULLVm_GwaHSNq7QHp9";

let cart = [];
let products = [];
let currentGame = "all";

/* HEADER SHRINK */
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  if (window.scrollY > 50) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
});

/* ROTATING TEXT */
const words = ["Game Items", "Accounts", "Currency", "Boosting"];
let i = 0;
setInterval(() => {
  const el = document.getElementById("rotating-text");
  if (!el) return;
  el.style.opacity = 0;
  setTimeout(() => {
    el.textContent = words[i];
    el.style.opacity = 1;
    i = (i + 1) % words.length;
  }, 300);
}, 2000);

/* PANELS */
function toggleCart() {
  document.getElementById("cart-panel").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("active");
}
window.toggleCart = toggleCart;

function toggleAdmin() {
  document.getElementById("admin-panel").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("active");
}
window.toggleAdmin = toggleAdmin;

document.getElementById("overlay").addEventListener("click", () => {
  document.getElementById("cart-panel").classList.remove("open");
  document.getElementById("admin-panel").classList.remove("open");
  document.getElementById("overlay").classList.remove("active");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("cart-panel").classList.remove("open");
    document.getElementById("admin-panel").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
  }
});

/* ADMIN PASSWORD */
function loginAdmin() {
  if (document.getElementById("admin-password").value === "1234") {
    document.getElementById("admin-content").style.display = "block";
  } else alert("Wrong password");
}
window.loginAdmin = loginAdmin;

/* FIRESTORE */
onSnapshot(collection(db, "products"), snapshot => {
  products = [];
  snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
  renderProducts();
  renderAdminItems();
});

async function addItem() {
  const name = item-name.value;
  const price = Number(item-price.value);
  const image = item-image.value;
  const game = item-game.value;
  const stock = Number(item-stock.value);

  if (!name || !price) return alert("Fill fields");

  await addDoc(collection(db, "products"), { name, price, image, game, stock });
}
window.addItem = addItem;

function renderProducts() {
  const container = products = document.getElementById("products");
  container.innerHTML = "";

  products
    .filter(p => currentGame === "all" || p.game === currentGame)
    .forEach(p => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${p.image || 'https://picsum.photos/300'}">
        <h3>${p.name}</h3>
        <p>$${p.price}</p>
        <button class="btn">Add</button>
      `;
      card.querySelector("button").onclick = () => {
        cart.push(p);
        updateCart();
      };
      container.appendChild(card);
    });
}

function renderAdminItems() {
  const container = document.getElementById("admin-items");
  container.innerHTML = "";
  products.forEach(p => {
    const div = document.createElement("div");
    div.innerHTML = `${p.name} - $${p.price}
      <button class="btn">Delete</button>`;
    div.querySelector("button").onclick = async () => {
      await deleteDoc(doc(db, "products", p.id));
    };
    container.appendChild(div);
  });
}

function updateCart() {
  const items = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const count = document.getElementById("cart-count");

  items.innerHTML = "";
  let total = 0;
  cart.forEach(i => {
    total += i.price;
    items.innerHTML += `<div>${i.name} - $${i.price}</div>`;
  });
  totalEl.innerText = "Total: $" + total;
  count.innerText = cart.length;
}

async function checkout() {
  const user = document.getElementById("buyer-discord").value;
  if (!user) return alert("Enter Discord username");

  let total = 0;
  let text = "";
  cart.forEach(i => {
    total += i.price;
    text += `${i.name} - $${i.price}\n`;
  });

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `NEW ORDER\nUser: ${user}\n\n${text}\nTotal: $${total}`
    })
  });

  cart = [];
  updateCart();
}
window.checkout = checkout;

document.addEventListener("click", e => {
  if (e.target.classList.contains("game")) {
    document.querySelectorAll(".game").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    currentGame = e.target.dataset.game;
    renderProducts();
  }
});

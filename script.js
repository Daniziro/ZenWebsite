const ADMIN_PASSWORD = "1234"; // CHANGE THIS

let items = JSON.parse(localStorage.getItem("items")) || [
  {
    name: "Hyuga Account",
    price: 10,
    description: "Legendary fire blade",
    stock: 5,
    image: "https://via.placeholder.com/300x200"
  }
];

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const container = document.getElementById("items-container");
const cartPanel = document.getElementById("cart-panel");
const adminPanel = document.getElementById("admin-panel");

function saveItems() {
  localStorage.setItem("items", JSON.stringify(items));
}

function renderItems() {
  container.innerHTML = "";
  items.forEach((item, index) => {
    container.innerHTML += `
      <div class="item-card">
        <img src="${item.image}">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="price">$${item.price}</div>
        <div>Stock: ${item.stock}</div>
        <button onclick="addToCart(${index})" ${item.stock <= 0 ? "disabled" : ""}>
          ${item.stock <= 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    `;
  });
}

function addToCart(index) {
  if (items[index].stock <= 0) return;

  cart.push(items[index]);
  items[index].stock -= 1;

  saveItems();
  localStorage.setItem("cart", JSON.stringify(cart));

  updateCart();
  renderItems();
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

document.getElementById("checkout").onclick = () => {
  let orderText = cart.map(item => `${item.name} - $${item.price}`).join("\n");

  fetch("YOUR_DISCORD_WEBHOOK", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `🛒 New Order:\n${orderText}`
    })
  });

  alert("Order sent!");
  cart = [];
  localStorage.removeItem("cart");
  updateCart();
};

function openAdmin() {
  adminPanel.classList.toggle("open");
}

function loginAdmin() {
  const pass = document.getElementById("admin-password").value;
  if (pass === ADMIN_PASSWORD) {
    document.getElementById("admin-login").style.display = "none";
    document.getElementById("admin-content").style.display = "block";
    renderAdminItems();
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

  items.push(newItem);
  saveItems();
  renderItems();
  renderAdminItems();
}

function renderAdminItems() {
  const adminItems = document.getElementById("admin-items");
  adminItems.innerHTML = "";

  items.forEach((item, index) => {
    adminItems.innerHTML += `
      <div>
        ${item.name} (Stock: ${item.stock})
        <button onclick="deleteItem(${index})">Delete</button>
      </div>
    `;
  });
}

function deleteItem(index) {
  items.splice(index, 1);
  saveItems();
  renderItems();
  renderAdminItems();
}

renderItems();
updateCart();

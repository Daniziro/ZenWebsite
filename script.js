const items = [
  {
    name: "Dragon Sword",
    price: 10,
    description: "Legendary fire blade",
    image: "https://via.placeholder.com/300x200"
  },
  {
    name: "Shadow Armor",
    price: 25,
    description: "Invisibility boost set",
    image: "https://via.placeholder.com/300x200"
  }
];

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const container = document.getElementById("items-container");
const cartPanel = document.getElementById("cart-panel");
const cartBtn = document.getElementById("cart-btn");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");

function renderItems() {
  container.innerHTML = "";
  items.forEach((item, index) => {
    container.innerHTML += `
      <div class="item-card">
        <img src="${item.image}">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="price">$${item.price}</div>
        <button onclick="addToCart(${index})">Add to Cart</button>
      </div>
    `;
  });
}

function addToCart(index) {
  cart.push(items[index]);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
}

function updateCart() {
  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    total += item.price;
    cartItems.innerHTML += `
      <div>
        ${item.name} - $${item.price}
      </div>
    `;
  });

  cartTotal.innerText = "Total: $" + total;
  cartCount.innerText = cart.length;
}

cartBtn.onclick = () => {
  cartPanel.classList.toggle("open");
};

document.getElementById("checkout").onclick = () => {
  let orderText = cart.map(item => `${item.name} - $${item.price}`).join("\n");

  fetch("https://discord.com/api/webhooks/1476962164269908148/AgpaowygIg05V__Q6r-s_hT58fX4hynQarnYKNfeK2Jk9PEmfrULLVm_GwaHSNq7QHp9", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `🛒 New Order:\n${orderText}`
    })
  });

  alert("Order sent! We will contact you.");
  cart = [];
  localStorage.removeItem("cart");
  updateCart();
};

renderItems();
updateCart();
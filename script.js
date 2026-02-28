// script.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* -------------------------------------------------------------------------
   FIREBASE - keep your config (I left your original project config here)
   ------------------------------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyA9XzO8YWtcEDG6Oqy9aUR-NONtZtyASo0",
  authDomain: "website-8b72a.firebaseapp.com",
  projectId: "website-8b72a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productsCol = collection(db, "products");

/* -------------------------------------------------------------------------
   DOM references
   ------------------------------------------------------------------------- */
const productsGrid = document.getElementById("productsGrid");
const adminPanel = document.getElementById("adminPanel");
const overlay = document.getElementById("overlay");
const adminItems = document.getElementById("admin-items");
const searchInput = document.getElementById("search");
const gamesRow = document.getElementById("gamesRow");

let allProducts = [];
let currentGame = "all";

/* -------------------------------------------------------------------------
   Admin panel toggle
   ------------------------------------------------------------------------- */
window.toggleAdmin = function toggleAdmin() {
  const isOpen = adminPanel.getAttribute("aria-hidden") === "false";
  adminPanel.setAttribute("aria-hidden", (!isOpen).toString());
  overlay.classList.toggle("active", !isOpen);
  overlay.addEventListener("click", () => {
    adminPanel.setAttribute("aria-hidden", "true");
    overlay.classList.remove("active");
  }, { once: true });
};

/* -------------------------------------------------------------------------
   Add item (admin) - FIXED: writes to Firestore properly
   ------------------------------------------------------------------------- */
window.addItem = async function addItem() {
  const name = document.getElementById("item-name").value.trim();
  const price = parseFloat(document.getElementById("item-price").value);
  const game = document.getElementById("item-game").value.trim() || "General";
  const category = document.getElementById("item-category").value;
  const stock = parseInt(document.getElementById("item-stock").value) || 1;
  const image = document.getElementById("item-image").value.trim() || "";

  if (!name || Number.isNaN(price)) {
    alert("Please provide product name and valid price.");
    return;
  }

  try {
    await addDoc(productsCol, {
      name,
      price,
      game,
      category,
      stock,
      image,
      createdAt: serverTimestamp()
    });

    // small UI feedback
    showToast("Product added");
    clearAdminInputs();
  } catch (err) {
    console.error("Failed adding product:", err);
    alert("Error adding product (check console).");
  }
};

window.clearAdminInputs = function () {
  document.getElementById("item-name").value = "";
  document.getElementById("item-price").value = "";
  document.getElementById("item-game").value = "";
  document.getElementById("item-stock").value = "1";
  document.getElementById("item-image").value = "";
};

/* -------------------------------------------------------------------------
   Realtime listener for products
   ------------------------------------------------------------------------- */
const q = query(productsCol, orderBy("createdAt", "desc"));
onSnapshot(q, (snap) => {
  const items = [];
  snap.forEach(docSnap => {
    items.push({ id: docSnap.id, ...docSnap.data() });
  });
  allProducts = items;
  renderProducts();
  renderAdminList();
  renderGamePills();
});

/* -------------------------------------------------------------------------
   Render functions
   ------------------------------------------------------------------------- */
function renderProducts() {
  const term = (searchInput.value || "").toLowerCase();
  const filtered = allProducts.filter(p => {
    if (currentGame !== "all" && p.game && p.game.toLowerCase() !== currentGame) return false;
    if (term && !(p.name?.toLowerCase().includes(term) || p.game?.toLowerCase().includes(term))) return false;
    return true;
  });

  productsGrid.innerHTML = filtered.map(p => productCardHtml(p)).join("");
  // attach simple event delegation for add-to-cart & admin delete
  productsGrid.querySelectorAll(".add-cart").forEach(btn => {
    btn.onclick = (e) => {
      const id = e.currentTarget.dataset.id;
      const prod = allProducts.find(x => x.id === id);
      addToCart(prod);
      showToast("Added to cart");
    };
  });
  productsGrid.querySelectorAll(".admin-delete").forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("Delete product?")) return;
      try {
        await deleteDoc(doc(productsCol.firestore, "products", id));
        showToast("Deleted");
      } catch (err) {
        console.error(err);
        alert("Delete failed");
      }
    };
  });
}

function productCardHtml(p) {
  const img = p.image || `https://picsum.photos/seed/${p.id}/600/400`;
  const stock = typeof p.stock === "number" ? p.stock : "-";
  const price = Number(p.price || 0).toFixed(2);
  // admin-delete available inside admin panel view also: we show delete button only in admin list and here keep add to cart
  return `
    <div class="card">
      <div class="thumb"><img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}"></div>
      <div class="meta">
        <h4>${escapeHtml(p.name)}</h4>
        <div class="price">$${price}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="tags">
          <div class="badge">${escapeHtml(p.game || 'General')}</div>
          <div class="badge">${escapeHtml(p.category || '—')}</div>
        </div>
        <div class="actions">
          <button class="btn small add-cart" data-id="${p.id}">Add</button>
        </div>
      </div>
      <div style="margin-top:8px;font-size:13px;color:rgba(255,255,255,0.75)">Stock: ${stock}</div>
    </div>
  `.trim();
}

function renderAdminList() {
  adminItems.innerHTML = allProducts.map(p => `
    <div class="admin-item">
      <div class="left">
        <div class="thumb"><img src="${escapeHtml(p.image || `https://picsum.photos/seed/${p.id}/200/200`)}" style="width:100%;height:100%;object-fit:cover"/></div>
        <div>
          <div style="font-weight:700">${escapeHtml(p.name)}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7)">${escapeHtml(p.game || '')} • $${Number(p.price||0).toFixed(2)}</div>
        </div>
      </div>
      <div class="right">
        <button class="btn ghost admin-delete" data-id="${p.id}">Delete</button>
      </div>
    </div>
  `).join("");
}

/* -------------------------------------------------------------------------
   Game pills (filters)
   ------------------------------------------------------------------------- */
function renderGamePills() {
  const games = ["all", ...new Set(allProducts.map(p => (p.game || "General").toLowerCase()))];
  gamesRow.innerHTML = games.map(g => `<div class="pill ${currentGame===g?'active':''}" data-game="${g}">${g==='all'?'All':capitalize(g)}</div>`).join("");

  gamesRow.querySelectorAll(".pill").forEach(p => {
    p.onclick = () => {
      currentGame = p.dataset.game;
      // update active classes
      gamesRow.querySelectorAll(".pill").forEach(x => x.classList.remove("active"));
      p.classList.add("active");
      renderProducts();
    };
  });
}

/* -------------------------------------------------------------------------
   Search
   ------------------------------------------------------------------------- */
searchInput.addEventListener("input", () => renderProducts());

/* -------------------------------------------------------------------------
   Cart (very simple localStorage cart)
   ------------------------------------------------------------------------- */
let cart = JSON.parse(localStorage.getItem("zen_cart") || "[]");
function addToCart(item) {
  if (!item) return;
  cart.push({ id: item.id, name: item.name, price: item.price });
  localStorage.setItem("zen_cart", JSON.stringify(cart));
}
window.checkout = function checkout() {
  if (cart.length === 0) return alert("Cart empty");
  // stub - implement checkout flow or Discord webhook here
  showToast("Checkout - implement server flow");
  cart = [];
  localStorage.removeItem("zen_cart");
};

/* -------------------------------------------------------------------------
   Utility: escape html
   ------------------------------------------------------------------------- */
function escapeHtml(s) {
  if (!s) return "";
  return s.replaceAll && typeof s.replaceAll === "function" ?
    s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;") :
    String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* -------------------------------------------------------------------------
   Tiny toast utility
   ------------------------------------------------------------------------- */
function showToast(message) {
  const t = document.createElement("div");
  t.className = "zen-toast";
  t.innerText = message;
  Object.assign(t.style, {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    padding: "10px 14px",
    borderRadius: "10px",
    background: "linear-gradient(90deg,#7c3aed,#3b82f6)",
    color: "white",
    zIndex: 9999,
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    fontWeight: 700
  });
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("hide"), 2200);
  setTimeout(() => t.remove(), 2600);
}

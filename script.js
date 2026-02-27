import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 Firebase Config
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

// 🔔 Discord Webhook
const webhookURL = "https://discord.com/api/webhooks/1476962164269908148/AgpaowygIg05V__Q6r-s_hT58fX4hynQarnYKNfeK2Jk9PEmfrULLVm_GwaHSNq7QHp9";

// ✅ WAIT FOR PAGE LOAD
document.addEventListener("DOMContentLoaded", () => {

  const adminBtn = document.getElementById("adminBtn");
  const adminPanel = document.getElementById("adminPanel");
  const addItemBtn = document.getElementById("addItemBtn");
  const itemsContainer = document.getElementById("itemsContainer");
  const gameFilter = document.getElementById("gameFilter");

  let currentGame = "Bloodlines";

  // 🔥 Admin Toggle
  adminBtn.addEventListener("click", () => {
    adminPanel.classList.toggle("hidden");
  });

  // 🔥 Add Item
  addItemBtn.addEventListener("click", async () => {
    const name = document.getElementById("itemName").value;
    const price = document.getElementById("itemPrice").value;
    const image = document.getElementById("itemImage").value;
    const game = document.getElementById("gameSelectAdmin").value;

    if (!name || !price || !image) {
      alert("Fill all fields");
      return;
    }

    await addDoc(collection(db, "items"), {
      name,
      price,
      image,
      game
    });

    alert("Item Added!");
    loadItems();
  });

  // 🔥 Load Items
  async function loadItems() {
    itemsContainer.innerHTML = "";
    const querySnapshot = await getDocs(collection(db, "items"));

    querySnapshot.forEach((doc) => {
      const item = doc.data();

      if (item.game === currentGame) {
        const div = document.createElement("div");
        div.classList.add("item-card");

        div.innerHTML = `
          <img src="${item.image}">
          <h3>${item.name}</h3>
          <p>$${item.price}</p>
          <button class="buyBtn">Buy</button>
        `;

        div.querySelector(".buyBtn").addEventListener("click", () => {
          const discordUser = prompt("Enter your Discord Username (example: user#1234)");

          if (!discordUser) {
            alert("Discord username required");
            return;
          }

          fetch(webhookURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `🛒 NEW ORDER\nGame: ${item.game}\nItem: ${item.name}\nPrice: $${item.price}\nDiscord: ${discordUser}`
            })
          });

          alert("Order Sent! We will contact you on Discord.");
        });

        itemsContainer.appendChild(div);
      }
    });
  }

  // 🎮 Game Selection
  gameFilter.addEventListener("change", (e) => {
    currentGame = e.target.value;
    loadItems();
  });

  loadItems();
});

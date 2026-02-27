body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #0f0f0f;
  color: white;
}

.header {
  display: flex;
  justify-content: space-between;
  padding: 15px 30px;
  background: #151515;
}

.logo {
  font-size: 22px;
  font-weight: bold;
}

.btn {
  padding: 8px 14px;
  background: #222;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 6px;
  margin-left: 8px;
}

.primary {
  background: #5b5bff;
}

.games {
  text-align: center;
  padding: 15px;
}

.game {
  margin: 5px;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  background: #222;
  color: white;
  cursor: pointer;
}

.game.active {
  background: #5b5bff;
}

.products {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  padding: 20px;
}

.card {
  background: #181818;
  padding: 15px;
  border-radius: 10px;
}

.card img {
  width: 100%;
  border-radius: 6px;
}

.panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 320px;
  height: 100%;
  background: #151515;
  padding: 20px;
  transition: 0.3s;
  overflow-y: auto;
}

.panel.open {
  right: 0;
}

input, select {
  width: 100%;
  padding: 8px;
  margin: 6px 0;
  border-radius: 6px;
  border: none;
}

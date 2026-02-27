// ===============================
// FULL READY-TO-UPLOAD PROJECT
// Upload this entire structure to GitHub
// Deploy on Netlify (build: npm run build, publish: dist)
// ===============================

// ===============================
// package.json
// ===============================
{
  "name": "stock-catalog-discord",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}

// ===============================
// vite.config.js
// ===============================
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})

// ===============================
// netlify.toml
// ===============================
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

// ===============================
// index.html
// ===============================
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Stock Catalog</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

// ===============================
// src/main.jsx
// ===============================
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')).render(<App />)

// ===============================
// src/App.jsx
// ===============================
import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'stock_catalog_v1'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export default function App() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setItems(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addItem(e) {
    e.preventDefault()
    if (!name) return
    setItems([{ id: uid(), name, price: parseFloat(price) || 0, qty: parseInt(qty) || 0 }, ...items])
    setName(''); setPrice(''); setQty('')
  }

  function removeItem(id) {
    setItems(items.filter(i => i.id !== id))
  }

  async function sendToDiscord() {
    setStatus('Sending...')
    const res = await fetch('/.netlify/functions/sendDiscord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, message })
    })
    if (res.ok) setStatus('✅ Sent to Discord server')
    else setStatus('❌ Error sending')
  }

  return (
    <div className="app">
      <h1>Neon Stock Catalog</h1>

      <form onSubmit={addItem} className="form">
        <input placeholder="Item name" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Price" type="number" value={price} onChange={e=>setPrice(e.target.value)} />
        <input placeholder="Quantity" type="number" value={qty} onChange={e=>setQty(e.target.value)} />
        <button>Add Item</button>
      </form>

      <div className="grid">
        {items.map(item => (
          <div key={item.id} className={`card ${item.qty <= 0 ? 'out' : ''}`}>
            <h3>{item.name}</h3>
            <p>${item.price}</p>
            <p>Stock: {item.qty}</p>
            <button className="danger" onClick={()=>removeItem(item.id)}>Remove</button>
          </div>
        ))}
      </div>

      <div className="discord">
        <textarea placeholder="Optional message" value={message} onChange={e=>setMessage(e.target.value)} />
        <button onClick={sendToDiscord}>Send to Server</button>
        <p>{status}</p>
      </div>
    </div>
  )
}

// ===============================
// src/styles.css
// ===============================
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  color: white;
}

.app {
  padding: 30px;
  text-align: center;
}

h1 {
  color: #a855f7;
}

.form input {
  margin: 5px;
  padding: 8px;
  border-radius: 6px;
  border: none;
}

button {
  padding: 8px 12px;
  margin: 5px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: linear-gradient(90deg, #06b6d4, #a855f7);
  color: white;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.card {
  background: rgba(255,255,255,0.05);
  padding: 15px;
  border-radius: 10px;
}

.card.out {
  opacity: 0.5;
}

.danger {
  background: #ff3b30;
}

.discord {
  margin-top: 30px;
}

textarea {
  width: 300px;
  height: 80px;
  border-radius: 8px;
  border: none;
  padding: 8px;
}

// ===============================
// netlify/functions/sendDiscord.js
// ===============================
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { items, message } = JSON.parse(event.body)
  const webhook = process.env.DISCORD_WEBHOOK_URL

  if (!webhook) {
    return { statusCode: 500, body: 'Missing webhook env variable' }
  }

  const list = items.map(i => `• ${i.name} - $${i.price} - Stock: ${i.qty}`).join('\n')
  const content = `${message ? message + '\n\n' : ''}📦 Current Stock:\n${list}`

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })

  if (!res.ok) {
    return { statusCode: 500, body: 'Discord error' }
  }

  return { statusCode: 200, body: 'Sent' }
}

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');

:root{
  --bg-1: #0b0f1a;
  --glass-1: rgba(255,255,255,0.04);
  --accent-purple: #7c3aed;
  --accent-blue: #3b82f6;
  --muted: rgba(255,255,255,0.7);
}

/* base */
*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;
  font-family:'Inter',system-ui,Arial;
  background: radial-gradient(circle at 10% 10%, #0f1230 0%, #07080d 40%, #04050a 100%);
  color:#fff;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  min-height:100vh;
  padding-top:72px; /* navbar height spacing */
  position:relative;
  overflow-x:hidden;
}

/* background orbs */
.bg-orb{
  position:fixed;
  border-radius:50%;
  filter:blur(140px);
  opacity:0.35;
  z-index:0;
  pointer-events:none;
}
.orb1{width:560px;height:560px;background:#7c3aed;left:-180px;top:-120px}
.orb2{width:420px;height:420px;background:#2563eb;right:-160px;top:80px}
.orb3{width:320px;height:320px;background:#f97316;left:10%;bottom:-80px;opacity:0.12}

/* navbar */
.navbar{
  position:fixed;
  top:0;left:0;right:0;
  height:72px;
  z-index:60;
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:12px 36px;
  background: linear-gradient(180deg, rgba(10,10,18,0.55), rgba(10,10,18,0.15));
  backdrop-filter: blur(8px);
  border-bottom:1px solid rgba(255,255,255,0.03);
}
.logo{
  font-weight:800;
  letter-spacing:0.6px;
  font-size:20px;
  color:white;
}

/* buttons */
.btn{
  border:0;
  padding:8px 14px;
  border-radius:12px;
  font-weight:600;
  cursor:pointer;
  background:transparent;
  color:var(--muted);
  transition:all .18s ease;
}
.btn.primary{
  background: linear-gradient(90deg,var(--accent-purple),var(--accent-blue));
  color:white;
  box-shadow:0 8px 28px rgba(59,130,246,0.08);
}
.btn.ghost{
  background: rgba(255,255,255,0.03);
  color:white;
}

/* hero */
.hero{
  text-align:center;
  padding:120px 16px 40px 16px;
  z-index:10;
  position:relative;
}
.hero h1{
  margin:0;
  font-size:56px;
  font-weight:800;
  letter-spacing:-1px;
}
.gradient-text{
  background:linear-gradient(90deg,var(--accent-purple),var(--accent-blue));
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  display:inline-block;
}
.sub{
  margin-top:12px;
  color:rgba(255,255,255,0.85);
  opacity:0.9;
}

/* search + pills */
.filter-row{
  display:flex;
  gap:20px;
  align-items:center;
  justify-content:center;
  margin:28px auto 0;
  width:92%;
  max-width:1100px;
  z-index:10;
}
.filter-row input#search{
  flex:1;
  padding:12px 16px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,0.04);
  background:rgba(255,255,255,0.03);
  color:white;
  outline:none;
  box-shadow:0 6px 18px rgba(2,6,23,0.6);
}
.category-pills{
  display:flex;
  gap:10px;
  align-items:center;
  flex-wrap:wrap;
  margin-left:10px;
}
.pill{
  padding:8px 14px;
  border-radius:999px;
  background:rgba(255,255,255,0.02);
  border:1px solid rgba(255,255,255,0.03);
  cursor:pointer;
  font-weight:600;
}
.pill.active{
  background:linear-gradient(90deg,var(--accent-purple),var(--accent-blue));
  color:white;
  box-shadow:0 8px 20px rgba(124,58,237,0.12);
}

/* products */
.products-section{
  margin:48px auto;
  width:94%;
  max-width:1200px;
  position:relative;
  z-index:10;
}
.section-title{margin:0 0 18px 0;font-size:22px;font-weight:700}

/* grid */
.grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
  gap:18px;
}
.card{
  background: rgba(255,255,255,0.03);
  border-radius:16px;
  padding:14px;
  border:1px solid rgba(255,255,255,0.04);
  backdrop-filter: blur(8px);
  transition: transform .25s ease, box-shadow .25s ease;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.card:hover{
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(2,6,23,0.6);
}
.card .thumb{
  width:100%;
  height:120px;
  border-radius:12px;
  background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.0));
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
}
.card .thumb img{width:100%;height:100%;object-fit:cover}
.card .meta{display:flex;align-items:center;justify-content:space-between}
.card h4{margin:0;font-size:16px}
.price{color:var(--accent-purple);font-weight:700}
.card .tags{display:flex;gap:8px;align-items:center}
.badge{font-size:12px;padding:6px 8px;border-radius:999px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.03)}

.card .actions{display:flex;gap:8px;margin-top:8px}
.small{padding:8px 10px;border-radius:10px;font-weight:700}

/* admin modal */
#overlay{
  position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:.18s;z-index:80;
}
#overlay.active{opacity:1;pointer-events:auto}
.admin-panel{
  position:fixed;right:20px;top:90px;width:420px;max-width:94%;height:calc(100vh - 120px);border-radius:14px;padding:14px;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  border:1px solid rgba(255,255,255,0.04);
  z-index:90;box-shadow:0 30px 60px rgba(2,6,23,0.6);transform: translateY(-10px);opacity:0;pointer-events:none;transition:.18s;
}
.admin-panel[aria-hidden="false"]{transform:none;opacity:1;pointer-events:auto}
.admin-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.03)}
.admin-body{padding-top:12px;display:flex;flex-direction:column;gap:8px;overflow:auto;height:calc(100% - 56px)}
.admin-body label{display:flex;flex-direction:column;font-size:13px;color:rgba(255,255,255,0.85)}
.admin-body input, .admin-body select{margin-top:8px;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.04);background:rgba(255,255,255,0.02);color:white;outline:none}

/* admin list */
#admin-items{display:flex;flex-direction:column;gap:8px;margin-top:8px}
.admin-item{display:flex;align-items:center;justify-content:space-between;padding:8px;border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.03)}
.admin-item .left{display:flex;gap:10px;align-items:center}
.admin-item .left .thumb{width:48px;height:48px;border-radius:8px;overflow:hidden;background:rgba(0,0,0,0.3)}
.admin-item .right button{margin-left:8px}

/* responsive */
@media (max-width:700px){
  .hero h1{font-size:32px}
  .grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}
  .admin-panel{left:10px;right:10px;top:70px;width:auto;height:calc(100vh - 80px)}
}

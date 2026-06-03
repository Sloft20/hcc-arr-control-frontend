@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  /* Paleta de Cores High-End */
  --primary: #2563eb; 
  --primary-light: #eff6ff;
  --success: #10b981;
  --success-light: #d1fae5;
  --danger: #ef4444;
  --danger-light: #fee2e2;
  --warning: #f59e0b;
  --warning-light: #fef3c7;
  --bg-color: #f8fafc;
  --surface: #ffffff;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --radius: 16px;
}

body {
  margin: 0;
  background-color: var(--bg-color);
  font-family: 'Inter', sans-serif;
  color: var(--text-main);
  -webkit-font-smoothing: antialiased;
}

/* ==========================================
   LAYOUT PRINCIPAL
   ========================================== */
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 20px;
  padding-bottom: 100px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
}

/* ==========================================
   NAVEGAÇÃO (BOTTOM BAR NO MOBILE)
   ========================================== */
.nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: var(--surface);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  z-index: 900;
  border-top: 1px solid var(--border);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 24px;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.nav-item.active {
  color: var(--primary);
  background-color: var(--primary-light);
}

.header-desktop {
  display: none;
}

/* ==========================================
   COMPONENTES UI (CARDS, INPUTS)
   ========================================== */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  border: 1px solid var(--border);
}

.card-main {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
}

/* Segmented Control (Alternador Entrada/Saída) */
.segmented-control {
  display: flex;
  background-color: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
}

.segmented-control button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.segmented-control button.active-green {
  background: var(--surface);
  color: var(--success);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.segmented-control button.active-red {
  background: var(--surface);
  color: var(--danger);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Inputs Modernos */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.input-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.input-modern {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  font-size: 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background-color: var(--bg-color);
  color: var(--text-main);
  transition: 0.2s;
  font-family: 'Inter', sans-serif;
}

.input-modern:focus {
  outline: none;
  border-color: var(--primary);
  background-color: var(--surface);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.btn-primary {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  transition: 0.2s;
}

/* ==========================================
   RESPONSIVIDADE: DESKTOP (MONITOR PC)
   ========================================== */
@media (min-width: 1024px) {
  .app-layout {
    flex-direction: row;
  }

  .nav-bar {
    position: sticky;
    top: 0;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    width: 280px;
    height: 100vh;
    padding: 32px 24px;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.02);
    border-top: none;
    border-right: 1px solid var(--border);
  }

  .nav-item {
    flex-direction: row;
    width: 100%;
    font-size: 15px;
    padding: 16px 20px;
    margin-bottom: 12px;
    justify-content: flex-start;
  }

  .header-desktop {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 48px;
    width: 100%;
  }

  .header-desktop h2 {
    margin: 0;
    font-size: 22px;
    color: var(--text-main);
    font-weight: 800;
  }

  .main-content {
    padding: 40px 60px;
    max-width: 1200px;
    margin: 0;
  }

  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .card-main {
    grid-column: span 3;
  }

  .form-container {
    max-width: 600px;
  }
}
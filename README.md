# Kamalig Food House – Promotional Web Application & Owner CMS

Official digital storefront and Owner Content Management System (CMS) for **Kamalig Food House** (`130 CCF Village, Brgy. Mayao Parada, Lucena City`).

> **Tagline:** *"Good Food, Great Mood!"* • *"Sarap na Abot-Kaya!"*
> **Scope:** Strictly a promotional digital storefront and menu showcase with full Owner CMS control (no online ordering, cart, checkout, payment, or inventory management).

---

## 1. Quick Start

### Option A: One-Click Windows Launcher
Double-click or run [`start-dev.bat`](file:///c:/Kamalig%20FH%20promotionl%20webapp/start-dev.bat) to start both the Django API server and the React + Vite frontend server.

### Option B: Run Servers Manually

#### Backend (Django + DRF)
```powershell
cd backend
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py seed_kamalig
.\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

#### Frontend (React + Vite + Tailwind CSS)
```powershell
cd frontend
npm.cmd run dev
```

- **Public Website:** http://localhost:5173
- **Owner CMS Login:** http://localhost:5173/admin/login
- **Default Owner Credentials:**
  - **Username:** `owner`
  - **Password:** `KamaligOwner2026!`

---

## 2. Database & Media Configuration (PostgreSQL & Cloudinary)

Configure [`backend/.env`](file:///c:/Kamalig%20FH%20promotionl%20webapp/backend/.env):

- **PostgreSQL:** Set `DB_ENGINE=postgresql` and provide `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` (or set `DATABASE_URL=postgres://user:pass@localhost:5432/kamalig_db`). When PostgreSQL is not running locally, set `DB_ENGINE=sqlite3` for instant local development.
- **Cloudinary Storage:** Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env` to store uploaded product and website photographs in Cloudinary; otherwise, optimized WebP images are stored locally under `backend/media/`.


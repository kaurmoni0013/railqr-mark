# RailSaathi

AI-Powered Laser QR Track Fitting Traceability & Predictive Maintenance for Indian Railways.

Built for Smart India Hackathon.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Leaflet, Framer Motion
- **Backend:** Python FastAPI, SQLAlchemy, SQLite (PostgreSQL-compatible schema), python-jose (JWT)
- **AI:** Scikit-learn powered risk prediction model (Decision Support / Prototype)

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+

### Backend

```bash
cd backend
pip install -r requirements.txt
python seed_data.py          # Seeds demo data (~50K fittings)
python -m uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

### Demo Credentials

| Role             | Email                          | Password     |
| ---------------- | ------------------------------ | ------------ |
| Admin            | admin@railqrmark.in            | Admin@123    |
| Railway Officer  | officer.nr@railqrmark.in       | Officer@123  |
| Inspector        | inspector1@railqrmark.in       | Inspector@123|
| Maintenance Eng. | maint1@railqrmark.in           | Maint@123    |
| Viewer           | viewer1@railqrmark.in          | Viewer@123   |

## Features

- QR code generation & verification for track fittings
- Digital passport for every fitting (full lifecycle)
- AI-powered risk scoring and predictive maintenance
- Inspection scheduling and compliance tracking
- Maintenance ticket workflow (Kanban)
- Zone/division/route performance dashboards
- Interactive Leaflet map with fitting locations
- Government-style responsive UI

## Project Structure

```
railqr-mark/
  backend/
    app/
      api/          # Route handlers (auth, fittings, inspections, etc.)
      core/         # Config, database, security, dependencies
      ml/           # Risk prediction model
      models/       # SQLAlchemy models
      schemas/      # Pydantic schemas
    seed_data.py    # Demo data generator
    requirements.txt
  frontend/
    src/
      components/   # Reusable UI components
      hooks/        # React hooks (auth, API, pagination)
      layouts/      # App shell / sidebar layout
      pages/        # Page components
      services/     # API client
      types/        # TypeScript interfaces
    vite.config.ts
    tailwind.config.js
```

## Disclaimer

Prototype developed for innovation and demonstration purposes. Not an official Indian Railways production system. Uses synthetic demo data unless explicitly identified as sourced aggregate public data.

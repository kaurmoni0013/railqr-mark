import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base

app = FastAPI(
    title=settings.APP_NAME,
    description="Railway Asset Management System with QR-based Digital Passports",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.QR_IMAGE_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=settings.STATIC_DIR), name="static")

from app.api.auth import router as auth_router
from app.api.camera_scan import router as camera_scan_router
from app.api.dashboard import router as dashboard_router
from app.api.fittings import router as fittings_router
from app.api.qr import router as qr_router
from app.api.inspections import router as inspections_router
from app.api.maintenance import router as maintenance_router
from app.api.alerts import router as alerts_router
from app.api.ai import router as ai_router
from app.api.reports import router as reports_router
from app.api.users import router as users_router
from app.api.maps import router as maps_router
from app.api.reference import router as reference_router

app.include_router(auth_router)
app.include_router(camera_scan_router)
app.include_router(dashboard_router)
app.include_router(fittings_router)
app.include_router(qr_router)
app.include_router(inspections_router)
app.include_router(maintenance_router)
app.include_router(alerts_router)
app.include_router(ai_router)
app.include_router(reports_router)
app.include_router(users_router)
app.include_router(maps_router)
app.include_router(reference_router)


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": "1.0.0"}


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

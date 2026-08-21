from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import (
    TrackFitting, Inspection, MaintenanceTicket, Alert,
    RailwayZone, User, AIInsight
)
from app.schemas.schemas import (
    DashboardSummary, HealthDistribution, TrendData, AlertSummary
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    total = db.query(func.count(TrackFitting.id)).scalar() or 0
    healthy = db.query(func.count(TrackFitting.id)).filter(TrackFitting.status == "HEALTHY").scalar() or 0
    attention = db.query(func.count(TrackFitting.id)).filter(TrackFitting.status == "ATTENTION").scalar() or 0
    critical = db.query(func.count(TrackFitting.id)).filter(TrackFitting.status == "CRITICAL").scalar() or 0
    maintenance = db.query(func.count(TrackFitting.id)).filter(TrackFitting.status == "UNDER_MAINTENANCE").scalar() or 0
    retired = db.query(func.count(TrackFitting.id)).filter(TrackFitting.status == "RETIRED").scalar() or 0

    total_inspections = db.query(func.count(Inspection.id)).scalar() or 0
    pending_inspections = db.query(func.count(Inspection.id)).filter(
        Inspection.status.in_(["SCHEDULED", "IN_PROGRESS"])
    ).scalar() or 0
    overdue_inspections = db.query(func.count(Inspection.id)).filter(
        Inspection.status == "OVERDUE"
    ).scalar() or 0

    open_tickets = db.query(func.count(MaintenanceTicket.id)).filter(
        MaintenanceTicket.status.in_(["SCHEDULED", "ASSIGNED", "IN_PROGRESS"])
    ).scalar() or 0

    critical_alerts = db.query(func.count(Alert.id)).filter(
        Alert.severity == "CRITICAL", Alert.is_resolved == False
    ).scalar() or 0
    active_alerts = db.query(func.count(Alert.id)).filter(
        Alert.is_resolved == False
    ).scalar() or 0

    avg_health = db.query(func.avg(TrackFitting.health_score)).scalar() or 0.0
    total_zones = db.query(func.count(RailwayZone.id)).scalar() or 0
    total_vendors = db.query(func.count(TrackFitting.vendor_id.distinct())).scalar() or 0

    return DashboardSummary(
        total_fittings=total,
        healthy_count=healthy,
        attention_count=attention,
        critical_count=critical,
        under_maintenance_count=maintenance,
        retired_count=retired,
        total_inspections=total_inspections,
        pending_inspections=pending_inspections,
        overdue_inspections=overdue_inspections,
        open_tickets=open_tickets,
        critical_alerts=critical_alerts,
        active_alerts=active_alerts,
        avg_health_score=round(float(avg_health), 1),
        total_zones=total_zones,
        total_vendors=total_vendors,
    )


@router.get("/trends", response_model=list)
def get_trends(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    now = datetime.utcnow()
    current_year = now.year
    years = list(range(current_year - 4, current_year + 1))
    trends = []

    for year in years:
        year_start = datetime(year, 1, 1)
        year_end = datetime(year + 1, 1, 1)

        fittings_in_year = db.query(TrackFitting).filter(
            TrackFitting.created_at < year_end
        ).all()

        healthy = sum(1 for f in fittings_in_year if f.status == "HEALTHY")
        attention = sum(1 for f in fittings_in_year if f.status == "ATTENTION")
        critical = sum(1 for f in fittings_in_year if f.status == "CRITICAL")
        under_maint = sum(1 for f in fittings_in_year if f.status == "UNDER_MAINTENANCE")
        total_in_year = len(fittings_in_year)
        avg_h = sum(f.health_score for f in fittings_in_year) / total_in_year if total_in_year else 0

        insp_count = db.query(func.count(Inspection.id)).filter(
            Inspection.created_at >= year_start,
            Inspection.created_at < year_end,
        ).scalar() or 0

        trends.append(TrendData(
            year=year,
            healthy=healthy,
            attention=attention,
            critical=critical,
            maintenance=under_maint,
            total_inspections=insp_count,
            avg_health=round(avg_h, 1),
        ))

    return trends


@router.get("/alerts", response_model=list)
def get_recent_alerts(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(20).all()
    result = []
    for a in alerts:
        from app.models.models import TrackFitting
        fitting = db.query(TrackFitting).filter(TrackFitting.id == a.fitting_id).first()
        result.append(AlertSummary(
            id=a.id,
            alert_code=a.alert_code,
            title=a.title,
            severity=a.severity,
            alert_type=a.alert_type,
            fitting_code=fitting.fitting_code if fitting else None,
            created_at=a.created_at,
            is_acknowledged=a.is_acknowledged,
            is_resolved=a.is_resolved,
        ))
    return result


@router.get("/health-distribution", response_model=list)
def get_health_distribution(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    total = db.query(func.count(TrackFitting.id)).scalar() or 1
    statuses = [
        ("Healthy", "HEALTHY"),
        ("Attention", "ATTENTION"),
        ("Critical", "CRITICAL"),
        ("Under Maintenance", "UNDER_MAINTENANCE"),
        ("Retired", "RETIRED"),
    ]
    result = []
    for label, status_val in statuses:
        count = db.query(func.count(TrackFitting.id)).filter(
            TrackFitting.status == status_val
        ).scalar() or 0
        result.append(HealthDistribution(
            label=label,
            count=count,
            percentage=round(count / total * 100, 1),
        ))
    return result

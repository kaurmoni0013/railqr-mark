import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import (
    TrackFitting, Inspection, MaintenanceTicket, Alert,
    RailwayZone, Vendor, Division, FittingType
)
from app.schemas.schemas import (
    AssetHealthReport, MaintenanceReport, InspectionComplianceReport,
    VendorQualityReport, ZonePerformanceReport
)

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/asset-health", response_model=list)
def asset_health_report(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    zones = db.query(RailwayZone).all()
    results = []
    for zone in zones:
        fittings = db.query(TrackFitting).filter(TrackFitting.zone_id == zone.id).all()
        total = len(fittings)
        if total == 0:
            continue
        avg_health = sum(f.health_score for f in fittings) / total
        healthy = sum(1 for f in fittings if f.status == "HEALTHY") / total * 100
        attention = sum(1 for f in fittings if f.status == "ATTENTION") / total * 100
        critical = sum(1 for f in fittings if f.status == "CRITICAL") / total * 100

        ages = []
        now = __import__("datetime").datetime.utcnow()
        for f in fittings:
            if f.installation_date:
                ages.append((now - f.installation_date).days / 365.25)

        results.append(AssetHealthReport(
            zone_name=zone.name,
            total_fittings=total,
            avg_health_score=round(avg_health, 1),
            healthy_pct=round(healthy, 1),
            attention_pct=round(attention, 1),
            critical_pct=round(critical, 1),
            oldest_fitting_age=round(max(ages), 1) if ages else None,
        ))
    return results


@router.get("/maintenance", response_model=list)
def maintenance_report(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    zones = db.query(RailwayZone).all()
    results = []
    for zone in zones:
        fittings = db.query(TrackFitting).filter(TrackFitting.zone_id == zone.id).all()
        fitting_ids = [f.id for f in fittings]
        if not fitting_ids:
            continue

        tickets = db.query(MaintenanceTicket).filter(
            MaintenanceTicket.fitting_id.in_(fitting_ids)
        ).all()
        total_t = len(tickets)
        completed = sum(1 for t in tickets if t.status == "COMPLETED")
        in_progress = sum(1 for t in tickets if t.status == "IN_PROGRESS")
        overdue = sum(1 for t in tickets if t.due_date and t.due_date < __import__("datetime").datetime.utcnow() and t.status not in ["COMPLETED", "CLOSED"])

        completion_days = []
        for t in tickets:
            if t.completed_date and t.created_at:
                completion_days.append((t.completed_date - t.created_at).days)
        avg_days = sum(completion_days) / len(completion_days) if completion_days else None

        total_cost = sum(t.actual_cost or t.estimated_cost or 0 for t in tickets)

        results.append(MaintenanceReport(
            zone_name=zone.name,
            total_tickets=total_t,
            completed=completed,
            in_progress=in_progress,
            overdue=overdue,
            avg_completion_days=round(avg_days, 1) if avg_days else None,
            total_cost=round(total_cost, 2),
        ))
    return results


@router.get("/inspection-compliance", response_model=list)
def inspection_compliance_report(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    zones = db.query(RailwayZone).all()
    results = []
    for zone in zones:
        fittings = db.query(TrackFitting).filter(TrackFitting.zone_id == zone.id).all()
        fitting_ids = [f.id for f in fittings]
        if not fitting_ids:
            continue

        inspections = db.query(Inspection).filter(
            Inspection.fitting_id.in_(fitting_ids)
        ).all()
        total_scheduled = len([i for i in inspections if i.status != "SCHEDULED" or True])
        completed = sum(1 for i in inspections if i.status == "COMPLETED")
        overdue = sum(1 for i in inspections if i.status == "OVERDUE")
        compliance = (completed / total_scheduled * 100) if total_scheduled > 0 else 0

        results.append(InspectionComplianceReport(
            zone_name=zone.name,
            total_scheduled=total_scheduled,
            completed=completed,
            compliance_rate=round(compliance, 1),
            overdue_count=overdue,
        ))
    return results


@router.get("/vendor-quality", response_model=list)
def vendor_quality_report(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    vendors = db.query(Vendor).filter(Vendor.is_active == True).all()
    results = []
    for vendor in vendors:
        fittings = db.query(TrackFitting).filter(TrackFitting.vendor_id == vendor.id).all()
        total = len(fittings)
        if total == 0:
            continue
        avg_health = sum(f.health_score for f in fittings) / total
        defect_count = sum(1 for f in fittings if f.status in ["CRITICAL", "ATTENTION"])
        defect_rate = defect_count / total * 100

        results.append(VendorQualityReport(
            vendor_name=vendor.name,
            total_fittings=total,
            avg_health_score=round(avg_health, 1),
            avg_rating=vendor.rating,
            defect_rate=round(defect_rate, 1),
        ))
    return results


@router.get("/zone-performance", response_model=list)
def zone_performance_report(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    zones = db.query(RailwayZone).all()
    now = __import__("datetime").datetime.utcnow()
    results = []
    for zone in zones:
        fittings = db.query(TrackFitting).filter(TrackFitting.zone_id == zone.id).all()
        fitting_ids = [f.id for f in fittings]
        total = len(fittings)
        if total == 0:
            continue

        avg_health = sum(f.health_score for f in fittings) / total

        inspections = db.query(Inspection).filter(
            Inspection.fitting_id.in_(fitting_ids)
        ).all() if fitting_ids else []
        completed_insp = sum(1 for i in inspections if i.status == "COMPLETED")
        compliance = (completed_insp / len(inspections) * 100) if inspections else 0

        tickets = db.query(MaintenanceTicket).filter(
            MaintenanceTicket.fitting_id.in_(fitting_ids)
        ).all() if fitting_ids else []
        completed_tickets = sum(1 for t in tickets if t.status in ["COMPLETED", "CLOSED"])
        efficiency = (completed_tickets / len(tickets) * 100) if tickets else 0

        critical_alerts = db.query(func.count(Alert.id)).filter(
            Alert.fitting_id.in_(fitting_ids),
            Alert.severity == "CRITICAL",
            Alert.is_resolved == False,
        ).scalar() if fitting_ids else 0

        results.append(ZonePerformanceReport(
            zone_name=zone.name,
            total_fittings=total,
            avg_health=round(avg_health, 1),
            inspection_compliance=round(compliance, 1),
            maintenance_efficiency=round(efficiency, 1),
            critical_alerts=critical_alerts,
        ))
    return results


@router.get("/export/{report_type}")
def export_report(report_type: str, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "asset-health":
        writer.writerow(["Zone", "Total Fittings", "Avg Health", "Healthy %", "Attention %", "Critical %"])
        zones = db.query(RailwayZone).all()
        for zone in zones:
            fittings = db.query(TrackFitting).filter(TrackFitting.zone_id == zone.id).all()
            total = len(fittings)
            if total == 0:
                continue
            avg_h = sum(f.health_score for f in fittings) / total
            h = sum(1 for f in fittings if f.status == "HEALTHY") / total * 100
            a = sum(1 for f in fittings if f.status == "ATTENTION") / total * 100
            c = sum(1 for f in fittings if f.status == "CRITICAL") / total * 100
            writer.writerow([zone.name, total, round(avg_h, 1), round(h, 1), round(a, 1), round(c, 1)])

    elif report_type == "maintenance":
        writer.writerow(["Zone", "Total Tickets", "Completed", "In Progress", "Overdue", "Total Cost"])
        zones = db.query(RailwayZone).all()
        for zone in zones:
            fittings = db.query(TrackFitting).filter(TrackFitting.zone_id == zone.id).all()
            fids = [f.id for f in fittings]
            if not fids:
                continue
            tickets = db.query(MaintenanceTicket).filter(MaintenanceTicket.fitting_id.in_(fids)).all()
            writer.writerow([
                zone.name, len(tickets),
                sum(1 for t in tickets if t.status == "COMPLETED"),
                sum(1 for t in tickets if t.status == "IN_PROGRESS"),
                sum(1 for t in tickets if t.due_date and t.due_date < now and t.status not in ["COMPLETED", "CLOSED"]),
                round(sum(t.actual_cost or t.estimated_cost or 0 for t in tickets), 2),
            ])

    elif report_type == "fittings":
        writer.writerow(["Code", "Type", "Zone", "Status", "Health Score", "Location"])
        fittings = db.query(TrackFitting).limit(5000).all()
        for f in fittings:
            ft = db.query(FittingType).filter(FittingType.id == f.fitting_type_id).first()
            zone = db.query(RailwayZone).filter(RailwayZone.id == f.zone_id).first()
            writer.writerow([
                f.fitting_code, ft.name if ft else "",
                zone.name if zone else "", f.status, f.health_score, f.location_name or "",
            ])

    else:
        writer.writerow(["Error"])
        writer.writerow(["Unknown report type"])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={report_type}_report.csv"},
    )

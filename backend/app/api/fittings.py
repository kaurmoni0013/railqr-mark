import math
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import (
    TrackFitting, FittingType, Vendor, RailwayZone, Division, Route,
    Inspection, MaintenanceTicket, Alert, QRCode
)
from app.schemas.schemas import (
    TrackFittingCreate, TrackFittingUpdate, TrackFittingRead,
    TrackFittingDetail, FittingPassport, TimelineEvent, PaginatedResponse
)

router = APIRouter(prefix="/api/fittings", tags=["Fittings"])


@router.get("", response_model=PaginatedResponse)
def list_fittings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    zone_id: int = Query(None),
    division_id: int = Query(None),
    status: str = Query(None),
    fitting_type_id: int = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    query = db.query(TrackFitting)
    if zone_id:
        query = query.filter(TrackFitting.zone_id == zone_id)
    if division_id:
        query = query.filter(TrackFitting.division_id == division_id)
    if status:
        query = query.filter(TrackFitting.status == status)
    if fitting_type_id:
        query = query.filter(TrackFitting.fitting_type_id == fitting_type_id)
    if search:
        query = query.filter(
            or_(
                TrackFitting.fitting_code.ilike(f"%{search}%"),
                TrackFitting.location_name.ilike(f"%{search}%"),
                TrackFitting.batch_number.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = query.order_by(TrackFitting.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse(
        items=[TrackFittingRead.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=TrackFittingRead)
def create_fitting(data: TrackFittingCreate, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    existing = db.query(TrackFitting).filter(TrackFitting.fitting_code == data.fitting_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Fitting code already exists")

    fitting = TrackFitting(**data.model_dump())
    db.add(fitting)
    db.commit()
    db.refresh(fitting)
    return TrackFittingRead.model_validate(fitting)


@router.get("/{fitting_id}", response_model=TrackFittingDetail)
def get_fitting(fitting_id: int, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    fitting = db.query(TrackFitting).filter(TrackFitting.id == fitting_id).first()
    if not fitting:
        raise HTTPException(status_code=404, detail="Fitting not found")

    ft = db.query(FittingType).filter(FittingType.id == fitting.fitting_type_id).first()
    vendor = db.query(Vendor).filter(Vendor.id == fitting.vendor_id).first()
    zone = db.query(RailwayZone).filter(RailwayZone.id == fitting.zone_id).first()
    div = db.query(Division).filter(Division.id == fitting.division_id).first()
    route = db.query(Route).filter(Route.id == fitting.route_id).first()

    return TrackFittingDetail(
        id=fitting.id,
        fitting_code=fitting.fitting_code,
        fitting_type_id=fitting.fitting_type_id,
        fitting_type_name=ft.name if ft else None,
        vendor_id=fitting.vendor_id,
        vendor_name=vendor.name if vendor else None,
        batch_number=fitting.batch_number,
        manufacturing_date=fitting.manufacturing_date,
        installation_date=fitting.installation_date,
        zone_id=fitting.zone_id,
        zone_name=zone.name if zone else None,
        division_id=fitting.division_id,
        division_name=div.name if div else None,
        route_id=fitting.route_id,
        route_name=route.name if route else None,
        latitude=fitting.latitude,
        longitude=fitting.longitude,
        location_name=fitting.location_name,
        status=fitting.status,
        health_score=fitting.health_score,
        service_life_years=fitting.service_life_years,
        last_inspection_date=fitting.last_inspection_date,
        next_inspection_date=fitting.next_inspection_date,
        created_at=fitting.created_at,
        updated_at=fitting.updated_at,
    )


@router.put("/{fitting_id}", response_model=TrackFittingRead)
def update_fitting(
    fitting_id: int,
    data: TrackFittingUpdate,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    fitting = db.query(TrackFitting).filter(TrackFitting.id == fitting_id).first()
    if not fitting:
        raise HTTPException(status_code=404, detail="Fitting not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(fitting, key, value)
    fitting.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(fitting)
    return TrackFittingRead.model_validate(fitting)


@router.get("/{fitting_id}/passport")
def get_passport(fitting_id: int, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    fitting = db.query(TrackFitting).filter(TrackFitting.id == fitting_id).first()
    if not fitting:
        raise HTTPException(status_code=404, detail="Fitting not found")

    ft = db.query(FittingType).filter(FittingType.id == fitting.fitting_type_id).first()
    vendor = db.query(Vendor).filter(Vendor.id == fitting.vendor_id).first()
    zone = db.query(RailwayZone).filter(RailwayZone.id == fitting.zone_id).first()
    div = db.query(Division).filter(Division.id == fitting.division_id).first()
    route = db.query(Route).filter(Route.id == fitting.route_id).first()

    detail = TrackFittingDetail(
        id=fitting.id,
        fitting_code=fitting.fitting_code,
        fitting_type_id=fitting.fitting_type_id,
        fitting_type_name=ft.name if ft else None,
        vendor_id=fitting.vendor_id,
        vendor_name=vendor.name if vendor else None,
        batch_number=fitting.batch_number,
        manufacturing_date=fitting.manufacturing_date,
        installation_date=fitting.installation_date,
        zone_id=fitting.zone_id,
        zone_name=zone.name if zone else None,
        division_id=fitting.division_id,
        division_name=div.name if div else None,
        route_id=fitting.route_id,
        route_name=route.name if route else None,
        latitude=fitting.latitude,
        longitude=fitting.longitude,
        location_name=fitting.location_name,
        status=fitting.status,
        health_score=fitting.health_score,
        service_life_years=fitting.service_life_years,
        last_inspection_date=fitting.last_inspection_date,
        next_inspection_date=fitting.next_inspection_date,
        created_at=fitting.created_at,
        updated_at=fitting.updated_at,
    )

    qr = db.query(QRCode).filter(QRCode.fitting_id == fitting_id, QRCode.is_active == True).first()
    insp_count = db.query(func_count(db, Inspection, Inspection.fitting_id == fitting_id))
    ticket_count = db.query(func_count(db, MaintenanceTicket, MaintenanceTicket.fitting_id == fitting_id))
    alert_count = db.query(func_count(db, Alert, Alert.fitting_id == fitting_id))

    recent_inspections = (
        db.query(Inspection).filter(Inspection.fitting_id == fitting_id)
        .order_by(Inspection.created_at.desc()).limit(5).all()
    )
    recent_tickets = (
        db.query(MaintenanceTicket).filter(MaintenanceTicket.fitting_id == fitting_id)
        .order_by(MaintenanceTicket.created_at.desc()).limit(5).all()
    )

    return FittingPassport(
        fitting=detail,
        qr_code=qr.qr_data if qr else None,
        inspection_count=insp_count,
        ticket_count=ticket_count,
        alert_count=alert_count,
        recent_inspections=[
            {"inspection_code": i.inspection_code, "status": i.status,
             "health_score": i.health_score, "created_at": i.created_at.isoformat()}
            for i in recent_inspections
        ],
        recent_tickets=[
            {"ticket_code": t.ticket_code, "status": t.status, "priority": t.priority,
             "created_at": t.created_at.isoformat()}
            for t in recent_tickets
        ],
    )


def func_count(db, model, *filters):
    q = db.query(model.id)
    for f in filters:
        q = q.filter(f)
    return q.count() or 0


@router.get("/{fitting_id}/timeline")
def get_timeline(fitting_id: int, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    fitting = db.query(TrackFitting).filter(TrackFitting.id == fitting_id).first()
    if not fitting:
        raise HTTPException(status_code=404, detail="Fitting not found")

    events = []

    if fitting.installation_date:
        events.append(TimelineEvent(
            event_type="INSTALLATION",
            date=fitting.installation_date,
            title="Fitting Installed",
            description=f"Installed at {fitting.location_name or 'Unknown location'}",
            status="COMPLETED",
        ))

    if fitting.manufacturing_date:
        events.append(TimelineEvent(
            event_type="MANUFACTURING",
            date=fitting.manufacturing_date,
            title="Fitting Manufactured",
            description=f"Batch: {fitting.batch_number}",
            status="COMPLETED",
        ))

    inspections = (
        db.query(Inspection).filter(Inspection.fitting_id == fitting_id)
        .order_by(Inspection.created_at.desc()).limit(20).all()
    )
    for i in inspections:
        events.append(TimelineEvent(
            event_type="INSPECTION",
            date=i.completed_date or i.created_at,
            title=f"Inspection {i.inspection_code}",
            description=i.remarks or f"Condition: {i.visual_condition}",
            status=i.status,
        ))

    tickets = (
        db.query(MaintenanceTicket).filter(MaintenanceTicket.fitting_id == fitting_id)
        .order_by(MaintenanceTicket.created_at.desc()).limit(20).all()
    )
    for t in tickets:
        events.append(TimelineEvent(
            event_type="MAINTENANCE",
            date=t.completed_date or t.created_at,
            title=f"Ticket {t.ticket_code}",
            description=t.issue_description,
            status=t.status,
        ))

    alerts = (
        db.query(Alert).filter(Alert.fitting_id == fitting_id)
        .order_by(Alert.created_at.desc()).limit(20).all()
    )
    for a in alerts:
        events.append(TimelineEvent(
            event_type="ALERT",
            date=a.created_at,
            title=a.title,
            description=a.description,
            status="RESOLVED" if a.is_resolved else ("ACKNOWLEDGED" if a.is_acknowledged else "ACTIVE"),
        ))

    events.sort(key=lambda e: e.date, reverse=True)
    return events

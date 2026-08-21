import math
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Inspection, TrackFitting, User
from app.schemas.schemas import (
    InspectionCreate, InspectionUpdate, InspectionRead, PaginatedResponse
)
from app.ml.risk_model import calculate_health_score

router = APIRouter(prefix="/api/inspections", tags=["Inspections"])


def _generate_inspection_code(db: Session) -> str:
    from sqlalchemy import func
    count = db.query(func.count(Inspection.id)).scalar() or 0
    return f"INSP-{count + 1:06d}"


@router.get("", response_model=PaginatedResponse)
def list_inspections(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    fitting_id: int = Query(None),
    inspector_id: int = Query(None),
    status: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    query = db.query(Inspection)
    if fitting_id:
        query = query.filter(Inspection.fitting_id == fitting_id)
    if inspector_id:
        query = query.filter(Inspection.inspector_id == inspector_id)
    if status:
        query = query.filter(Inspection.status == status)
    if search:
        query = query.filter(Inspection.inspection_code.ilike(f"%{search}%"))

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = query.order_by(Inspection.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse(
        items=[InspectionRead.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=InspectionRead)
def create_inspection(data: InspectionCreate, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    fitting = db.query(TrackFitting).filter(TrackFitting.id == data.fitting_id).first()
    if not fitting:
        raise HTTPException(status_code=404, detail="Fitting not found")

    inspector = db.query(User).filter(User.id == data.inspector_id).first()
    if not inspector:
        raise HTTPException(status_code=404, detail="Inspector not found")

    inspection = Inspection(
        inspection_code=_generate_inspection_code(db),
        **data.model_dump(),
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    return InspectionRead.model_validate(inspection)


@router.get("/{inspection_id}", response_model=InspectionRead)
def get_inspection(inspection_id: int, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return InspectionRead.model_validate(inspection)


@router.put("/{inspection_id}", response_model=InspectionRead)
def update_inspection(
    inspection_id: int,
    data: InspectionUpdate,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(inspection, key, value)

    if data.status == "COMPLETED":
        if not data.completed_by_email:
            raise HTTPException(status_code=400, detail="completed_by_email is required to mark inspection as completed")
        user_check = db.query(User).filter(User.email == data.completed_by_email, User.is_active == True).first()
        if not user_check:
            raise HTTPException(status_code=400, detail="Invalid email: no active user found with that email")
        inspection.completed_by_email = data.completed_by_email

    if data.status == "COMPLETED" and not inspection.completed_date:
        inspection.completed_date = datetime.utcnow()

    if inspection.wear_level is not None and inspection.corrosion_level is not None:
        fitting = db.query(TrackFitting).filter(TrackFitting.id == inspection.fitting_id).first()
        if fitting:
            age = 0
            if fitting.installation_date:
                age = (datetime.utcnow() - fitting.installation_date).days / 365.25
            age_factor = age / max(fitting.service_life_years or 15, 1)

            previous_inspections = (
                db.query(Inspection)
                .filter(Inspection.fitting_id == fitting.id, Inspection.id != inspection.id)
                .order_by(Inspection.created_at.desc())
                .all()
            )
            overdue = 1 if fitting.next_inspection_date and fitting.next_inspection_date < datetime.utcnow() else 0
            repeated = sum(1 for i in previous_inspections[:5] if i.damage_type)

            new_health = calculate_health_score(
                wear_level=inspection.wear_level,
                corrosion_level=inspection.corrosion_level,
                age_factor=age_factor,
                overdue_factor=overdue,
                repeated_defects=repeated,
            )
            inspection.health_score = new_health
            fitting.health_score = new_health
            fitting.last_inspection_date = datetime.utcnow()

            if new_health >= 80:
                fitting.status = "HEALTHY"
            elif new_health >= 50:
                fitting.status = "ATTENTION"
            else:
                fitting.status = "CRITICAL"

    db.commit()
    db.refresh(inspection)
    return InspectionRead.model_validate(inspection)

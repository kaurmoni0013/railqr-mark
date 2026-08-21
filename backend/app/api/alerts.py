import math
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Alert, User
from app.schemas.schemas import AlertRead, PaginatedResponse

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


class AlertResolveRequest(BaseModel):
    resolved_by_email: str


@router.get("", response_model=PaginatedResponse)
def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    severity: str = Query(None),
    alert_type: str = Query(None),
    is_acknowledged: bool = Query(None),
    is_resolved: bool = Query(None),
    fitting_id: int = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    query = db.query(Alert)
    if severity:
        query = query.filter(Alert.severity == severity)
    if alert_type:
        query = query.filter(Alert.alert_type == alert_type)
    if is_acknowledged is not None:
        query = query.filter(Alert.is_acknowledged == is_acknowledged)
    if is_resolved is not None:
        query = query.filter(Alert.is_resolved == is_resolved)
    if fitting_id:
        query = query.filter(Alert.fitting_id == fitting_id)
    if search:
        query = query.filter(
            or_(
                Alert.alert_code.ilike(f"%{search}%"),
                Alert.title.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = query.order_by(Alert.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse(
        items=[AlertRead.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/{alert_id}/acknowledge", response_model=AlertRead)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_acknowledged = True
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return AlertRead.model_validate(alert)


@router.post("/{alert_id}/resolve", response_model=AlertRead)
def resolve_alert(
    alert_id: int,
    body: AlertResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    resolver_check = db.query(User).filter(User.email == body.resolved_by_email, User.is_active == True).first()
    if not resolver_check:
        raise HTTPException(status_code=400, detail="Invalid email: no active user found with that email")

    alert.is_resolved = True
    alert.resolved_by = current_user.id
    alert.resolved_at = datetime.utcnow()
    alert.resolved_by_email = body.resolved_by_email
    if not alert.is_acknowledged:
        alert.is_acknowledged = True
        alert.acknowledged_by = current_user.id
        alert.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return AlertRead.model_validate(alert)

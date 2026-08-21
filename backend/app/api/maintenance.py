import math
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import (
    MaintenanceTicket, MaintenanceHistory, TrackFitting, User
)
from app.schemas.schemas import (
    MaintenanceTicketCreate, MaintenanceTicketUpdate,
    MaintenanceTicketRead, MaintenanceHistoryRead, PaginatedResponse
)

router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])


def _generate_ticket_code(db: Session) -> str:
    from sqlalchemy import func
    count = db.query(func.count(MaintenanceTicket.id)).scalar() or 0
    return f"MTK-{count + 1:06d}"


@router.get("", response_model=PaginatedResponse)
def list_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    fitting_id: int = Query(None),
    assigned_to: int = Query(None),
    priority: str = Query(None),
    status: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    query = db.query(MaintenanceTicket)
    if fitting_id:
        query = query.filter(MaintenanceTicket.fitting_id == fitting_id)
    if assigned_to:
        query = query.filter(MaintenanceTicket.assigned_to == assigned_to)
    if priority:
        query = query.filter(MaintenanceTicket.priority == priority)
    if status:
        query = query.filter(MaintenanceTicket.status == status)
    if search:
        query = query.filter(
            or_(
                MaintenanceTicket.ticket_code.ilike(f"%{search}%"),
                MaintenanceTicket.issue_description.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = query.order_by(MaintenanceTicket.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse(
        items=[MaintenanceTicketRead.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=MaintenanceTicketRead)
def create_ticket(data: MaintenanceTicketCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fitting = db.query(TrackFitting).filter(TrackFitting.id == data.fitting_id).first()
    if not fitting:
        raise HTTPException(status_code=404, detail="Fitting not found")

    ticket = MaintenanceTicket(
        ticket_code=_generate_ticket_code(db),
        **data.model_dump(),
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    history = MaintenanceHistory(
        ticket_id=ticket.id,
        changed_by=current_user.id,
        old_status=None,
        new_status=ticket.status,
        notes="Ticket created",
    )
    db.add(history)
    db.commit()

    return MaintenanceTicketRead.model_validate(ticket)


@router.put("/{ticket_id}", response_model=MaintenanceTicketRead)
def update_ticket(
    ticket_id: int,
    data: MaintenanceTicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.query(MaintenanceTicket).filter(MaintenanceTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = ticket.status
    update_data = data.model_dump(exclude_unset=True)
    notes = update_data.pop("notes", None)

    for key, value in update_data.items():
        setattr(ticket, key, value)

    if data.status == "COMPLETED" and not ticket.completed_date:
        ticket.completed_date = datetime.utcnow()

    new_status = data.status or old_status

    history = MaintenanceHistory(
        ticket_id=ticket.id,
        changed_by=current_user.id,
        old_status=old_status,
        new_status=new_status,
        notes=notes or f"Status changed from {old_status} to {new_status}",
    )
    db.add(history)
    db.commit()
    db.refresh(ticket)

    return MaintenanceTicketRead.model_validate(ticket)


@router.get("/{ticket_id}/history", response_model=list)
def get_ticket_history(ticket_id: int, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    ticket = db.query(MaintenanceTicket).filter(MaintenanceTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    history = (
        db.query(MaintenanceHistory)
        .filter(MaintenanceHistory.ticket_id == ticket_id)
        .order_by(MaintenanceHistory.created_at.desc())
        .all()
    )
    return [MaintenanceHistoryRead.model_validate(h) for h in history]

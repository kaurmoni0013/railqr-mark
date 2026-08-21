from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import RailwayZone, Division, Vendor, FittingType
from app.schemas.schemas import (
    RailwayZoneRead, DivisionRead, VendorRead, FittingTypeRead
)

router = APIRouter(prefix="/api", tags=["Reference Data"])


@router.get("/zones", response_model=list)
def list_zones(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    zones = db.query(RailwayZone).all()
    return [RailwayZoneRead.model_validate(z) for z in zones]


@router.get("/divisions", response_model=list)
def list_divisions(
    zone_id: int = Query(None),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    query = db.query(Division)
    if zone_id:
        query = query.filter(Division.zone_id == zone_id)
    divisions = query.all()
    return [DivisionRead.model_validate(d) for d in divisions]


@router.get("/vendors", response_model=list)
def list_vendors(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    vendors = db.query(Vendor).filter(Vendor.is_active == True).all()
    return [VendorRead.model_validate(v) for v in vendors]


@router.get("/fitting-types", response_model=list)
def list_fitting_types(db: Session = Depends(get_db), _user=Depends(get_current_user)):
    types = db.query(FittingType).all()
    return [FittingTypeRead.model_validate(t) for t in types]

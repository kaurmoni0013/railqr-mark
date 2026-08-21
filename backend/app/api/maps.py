from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import TrackFitting, Route, FittingType, RailwayZone
from app.schemas.schemas import MapMarker, MapRoute

router = APIRouter(prefix="/api/maps", tags=["Maps"])


@router.get("/markers", response_model=list)
def get_markers(
    zone_id: int = Query(None),
    status: str = Query(None),
    fitting_type_id: int = Query(None),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    query = db.query(TrackFitting).filter(
        TrackFitting.latitude.isnot(None),
        TrackFitting.longitude.isnot(None),
    )
    if zone_id:
        query = query.filter(TrackFitting.zone_id == zone_id)
    if status:
        query = query.filter(TrackFitting.status == status)
    if fitting_type_id:
        query = query.filter(TrackFitting.fitting_type_id == fitting_type_id)

    fittings = query.limit(5000).all()
    markers = []
    for f in fittings:
        ft = db.query(FittingType).filter(FittingType.id == f.fitting_type_id).first()
        markers.append(MapMarker(
            id=f.id,
            fitting_code=f.fitting_code,
            latitude=f.latitude,
            longitude=f.longitude,
            status=f.status,
            health_score=f.health_score,
            fitting_type=ft.name if ft else None,
            location_name=f.location_name,
        ))
    return markers


@router.get("/routes", response_model=list)
def get_routes(
    zone_id: int = Query(None),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    query = db.query(Route)
    if zone_id:
        query = query.filter(Route.zone_id == zone_id)

    routes = query.all()
    result = []
    for route in routes:
        fittings = db.query(TrackFitting).filter(TrackFitting.route_id == route.id).all()
        lats = [f.latitude for f in fittings if f.latitude is not None]
        lngs = [f.longitude for f in fittings if f.longitude is not None]

        result.append(MapRoute(
            id=route.id,
            name=route.name,
            code=route.code,
            start_location=route.start_location,
            end_location=route.end_location,
            fittings_count=len(fittings),
            latitudes=lats[:500],
            longitudes=lngs[:500],
        ))
    return result

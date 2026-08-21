from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import TrackFitting, Inspection, AIInsight, FittingType
from app.schemas.schemas import (
    RiskAnalysisResponse, AIInsightRead, ForecastItem, PaginatedResponse
)
from app.ml.risk_model import calculate_risk_score, generate_insights, forecast_maintenance
import math
import json

router = APIRouter(prefix="/api/ai", tags=["AI Insights"])


@router.get("/risk/{fitting_id}", response_model=RiskAnalysisResponse)
def get_risk_analysis(fitting_id: int, db: Session = Depends(get_db), _user=Depends(get_current_user)):
    fitting = db.query(TrackFitting).filter(TrackFitting.id == fitting_id).first()
    if not fitting:
        raise HTTPException(status_code=404, detail="Fitting not found")

    inspections = (
        db.query(Inspection)
        .filter(Inspection.fitting_id == fitting_id)
        .order_by(Inspection.created_at.desc())
        .limit(20)
        .all()
    )

    inspection_history = []
    for i in inspections:
        inspection_history.append({
            "wear_level": i.wear_level,
            "corrosion_level": i.corrosion_level,
            "damage_type": i.damage_type,
            "health_score": i.health_score,
            "created_at": i.created_at.isoformat() if i.created_at else None,
        })

    ft = db.query(FittingType).filter(FittingType.id == fitting.fitting_type_id).first()
    fitting_data = {
        "health_score": fitting.health_score,
        "status": fitting.status,
        "installation_date": fitting.installation_date,
        "service_life_years": ft.expected_life_years if ft else fitting.service_life_years,
        "expected_life_years": ft.expected_life_years if ft else None,
        "next_inspection_date": fitting.next_inspection_date,
    }

    result = calculate_risk_score(fitting_data, inspection_history)

    actions = []
    if result["risk_score"] >= 70:
        actions.append("Immediate inspection and potential replacement recommended")
        actions.append("Escalate to zone engineering team")
    elif result["risk_score"] >= 50:
        actions.append("Schedule priority inspection within 7 days")
        actions.append("Monitor wear and corrosion trends closely")
    elif result["risk_score"] >= 30:
        actions.append("Continue regular inspection schedule")
        actions.append("Review trend data for early intervention")
    else:
        actions.append("No immediate action required")
        actions.append("Maintain regular inspection schedule")

    if result["factors"].get("days_overdue", 0) > 0:
        actions.append("Overdue inspection must be scheduled immediately")

    return RiskAnalysisResponse(
        fitting_id=fitting.id,
        fitting_code=fitting.fitting_code,
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        health_score=fitting.health_score,
        factors=result["factors"],
        recommended_actions=actions,
        confidence=result["confidence"],
        model_version="Decision Support / Prototype Prediction",
    )


@router.get("/insights", response_model=PaginatedResponse)
def list_insights(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    insight_type: str = Query(None),
    fitting_id: int = Query(None),
    is_read: bool = Query(None),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    query = db.query(AIInsight)
    if insight_type:
        query = query.filter(AIInsight.insight_type == insight_type)
    if fitting_id:
        query = query.filter(AIInsight.fitting_id == fitting_id)
    if is_read is not None:
        query = query.filter(AIInsight.is_read == is_read)

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = query.order_by(AIInsight.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse(
        items=[AIInsightRead.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/forecast", response_model=list)
def get_forecast(
    zone_id: int = Query(None),
    days: int = Query(90, ge=1, le=365),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
):
    items = forecast_maintenance(db, zone_id=zone_id, days=days)
    return [ForecastItem(**item) for item in items]

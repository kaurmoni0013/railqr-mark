import json
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    TrackFitting, Inspection, Alert, AIInsight, RailwayZone, FittingType
)


def calculate_health_score(
    wear_level: float = 0,
    corrosion_level: float = 0,
    age_factor: float = 0,
    overdue_factor: float = 0,
    repeated_defects: int = 0,
) -> float:
    base_score = 100.0
    wear_penalty = wear_level * 4.0
    corrosion_penalty = corrosion_level * 3.5
    age_penalty = age_factor * 15.0
    overdue_penalty = overdue_factor * 12.0
    defect_penalty = repeated_defects * 5.0
    score = base_score - wear_penalty - corrosion_penalty - age_penalty - overdue_penalty - defect_penalty
    return max(0.0, min(100.0, round(score, 1)))


def calculate_risk_score(
    fitting_data: Dict[str, Any],
    inspection_history: List[Dict[str, Any]],
) -> Dict[str, Any]:
    factors = {}
    score = 0.0

    health = fitting_data.get("health_score", 100)
    health_risk = max(0, (100 - health) * 0.35)
    factors["health_score_impact"] = round(health_risk, 2)
    score += health_risk

    status = fitting_data.get("status", "HEALTHY")
    status_risk = {"CRITICAL": 30, "ATTENTION": 15, "UNDER_MAINTENANCE": 10, "RETIRED": 0, "HEALTHY": 0}.get(status, 0)
    factors["status_impact"] = status_risk
    score += status_risk

    now = datetime.utcnow()
    installation = fitting_data.get("installation_date")
    expected_life = fitting_data.get("service_life_years") or fitting_data.get("expected_life_years") or 15
    if installation:
        age_years = (now - installation).days / 365.25
        age_ratio = age_years / max(expected_life, 1)
        age_risk = min(25, max(0, (age_ratio - 0.6) * 40))
        factors["age_impact"] = round(age_risk, 2)
        factors["age_years"] = round(age_years, 1)
        factors["expected_life"] = expected_life
        score += age_risk
    else:
        factors["age_impact"] = 0
        factors["age_years"] = 0

    next_insp = fitting_data.get("next_inspection_date")
    if next_insp and next_insp < now:
        days_overdue = (now - next_insp).days
        overdue_risk = min(20, days_overdue * 0.3)
        factors["overdue_inspection_impact"] = round(overdue_risk, 2)
        factors["days_overdue"] = days_overdue
        score += overdue_risk
    else:
        factors["overdue_inspection_impact"] = 0
        factors["days_overdue"] = 0

    if inspection_history:
        recent_wear = [i.get("wear_level", 0) for i in inspection_history[-5:] if i.get("wear_level")]
        recent_corrosion = [i.get("corrosion_level", 0) for i in inspection_history[-5:] if i.get("corrosion_level")]
        if recent_wear:
            avg_wear = sum(recent_wear) / len(recent_wear)
            wear_trend = avg_wear * 2.0
            factors["wear_trend_impact"] = round(wear_trend, 2)
            score += wear_trend
        if recent_corrosion:
            avg_corrosion = sum(recent_corrosion) / len(recent_corrosion)
            corr_trend = avg_corrosion * 1.8
            factors["corrosion_trend_impact"] = round(corr_trend, 2)
            score += corr_trend

        defect_count = sum(1 for i in inspection_history if i.get("damage_type"))
        defect_risk = min(15, defect_count * 3)
        factors["repeated_defects_impact"] = round(defect_risk, 2)
        score += defect_risk

    score = max(0.0, min(100.0, round(score, 1)))

    if score >= 70:
        risk_level = "CRITICAL"
    elif score >= 50:
        risk_level = "HIGH"
    elif score >= 30:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    confidence = 0.65 + min(0.3, len(inspection_history) * 0.05)
    confidence = round(min(confidence, 0.95), 2)

    return {
        "risk_score": score,
        "risk_level": risk_level,
        "factors": factors,
        "confidence": confidence,
    }


def generate_insights(fitting_id: int, db: Session) -> List[Dict[str, Any]]:
    fitting = db.query(TrackFitting).filter(TrackFitting.id == fitting_id).first()
    if not fitting:
        return []

    inspections = (
        db.query(Inspection)
        .filter(Inspection.fitting_id == fitting_id)
        .order_by(Inspection.created_at.desc())
        .limit(10)
        .all()
    )
    now = datetime.utcnow()
    insights = []

    if fitting.health_score < 40:
        insights.append({
            "insight_type": "CRITICAL_RISK",
            "title": f"Critical health score detected for {fitting.fitting_code}",
            "description": f"Health score is {fitting.health_score}/100. Immediate attention required. "
                           f"This is a Decision Support / Prototype Prediction.",
            "risk_score": 100 - fitting.health_score,
            "confidence": 0.9,
            "factors": json.dumps({"health_score": fitting.health_score}),
            "recommended_action": "Schedule immediate inspection and consider replacement.",
        })

    if fitting.next_inspection_date and fitting.next_inspection_date < now:
        days = (now - fitting.next_inspection_date).days
        insights.append({
            "insight_type": "OVERDUE_INSPECTION",
            "title": f"Inspection overdue by {days} days for {fitting.fitting_code}",
            "description": f"This fitting is {days} days past its scheduled inspection. "
                           f"Decision Support / Prototype Prediction.",
            "risk_score": min(60, days * 2),
            "confidence": 0.95,
            "factors": json.dumps({"days_overdue": days}),
            "recommended_action": "Schedule inspection immediately.",
        })

    if inspections:
        latest = inspections[0]
        if latest.wear_level and latest.wear_level >= 7:
            insights.append({
                "insight_type": "WEAR",
                "title": f"High wear detected on {fitting.fitting_code}",
                "description": f"Wear level {latest.wear_level}/10. Prediction model suggests "
                               f"replacement within 6 months. Decision Support / Prototype Prediction.",
                "risk_score": latest.wear_level * 8,
                "confidence": 0.7,
                "factors": json.dumps({"wear_level": latest.wear_level}),
                "recommended_action": "Plan replacement during next maintenance window.",
            })
        if latest.corrosion_level and latest.corrosion_level >= 7:
            insights.append({
                "insight_type": "CORROSION",
                "title": f"Significant corrosion on {fitting.fitting_code}",
                "description": f"Corrosion level {latest.corrosion_level}/10. "
                               f"Decision Support / Prototype Prediction.",
                "risk_score": latest.corrosion_level * 7,
                "confidence": 0.7,
                "factors": json.dumps({"corrosion_level": latest.corrosion_level}),
                "recommended_action": "Apply anti-corrosion treatment and monitor closely.",
            })

    if fitting.health_score < 60 and fitting.service_life_years:
        fitting_type = db.query(FittingType).filter(FittingType.id == fitting.fitting_type_id).first()
        expected = fitting_type.expected_life_years if fitting_type else fitting.service_life_years
        if fitting.installation_date:
            age = (now - fitting.installation_date).days / 365.25
            if age > expected * 0.8:
                insights.append({
                    "insight_type": "MAINTENANCE_DUE",
                    "title": f"End-of-life approaching for {fitting.fitting_code}",
                    "description": f"Fitting is {age:.1f} years old (expected life: {expected} years). "
                                   f"Decision Support / Prototype Prediction.",
                    "risk_score": 50,
                    "confidence": 0.75,
                    "factors": json.dumps({"age": round(age, 1), "expected_life": expected}),
                    "recommended_action": "Schedule preventive replacement.",
                })

    return insights


def forecast_maintenance(db: Session, zone_id: Optional[int] = None, days: int = 90) -> List[Dict[str, Any]]:
    query = db.query(TrackFitting).filter(
        TrackFitting.status.in_(["HEALTHY", "ATTENTION"])
    )
    if zone_id:
        query = query.filter(TrackFitting.zone_id == zone_id)

    fittings = query.all()
    now = datetime.utcnow()
    forecast_items = []

    for f in fittings:
        days_to_maintain = None
        if f.health_score > 0:
            decay_rate = (100 - f.health_score) / max(30, f.service_life_years or 15) * 365.25
            if decay_rate > 0:
                days_to_maintain = int(f.health_score / decay_rate)

        if days_to_maintain is not None and 0 < days_to_maintain <= days:
            pred_date = now + timedelta(days=days_to_maintain)
            risk = max(0, 100 - f.health_score)
            priority = "CRITICAL" if risk >= 70 else "HIGH" if risk >= 50 else "MEDIUM"

            zone = db.query(RailwayZone).filter(RailwayZone.id == f.zone_id).first()
            ftype = db.query(FittingType).filter(FittingType.id == f.fitting_type_id).first()

            forecast_items.append({
                "fitting_id": f.id,
                "fitting_code": f.fitting_code,
                "zone_name": zone.name if zone else None,
                "type_name": ftype.name if ftype else None,
                "predicted_maintenance_date": pred_date,
                "current_health_score": f.health_score,
                "risk_score": risk,
                "priority": priority,
                "estimated_cost": round(500 + risk * 20, 2),
            })

    forecast_items.sort(key=lambda x: x["risk_score"], reverse=True)
    return forecast_items[:200]

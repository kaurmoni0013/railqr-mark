from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from datetime import datetime


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserRead"


# ─── User ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "VIEWER"
    zone_id: Optional[int] = None
    is_active: bool = True


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    zone_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    zone_id: Optional[int] = None
    is_active: bool
    created_at: datetime


# ─── RailwayZone ─────────────────────────────────────────────────────────────

class RailwayZoneCreate(BaseModel):
    name: str
    code: str
    region: Optional[str] = None


class RailwayZoneRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    region: Optional[str] = None
    created_at: datetime


# ─── Division ────────────────────────────────────────────────────────────────

class DivisionCreate(BaseModel):
    name: str
    code: str
    zone_id: int


class DivisionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    zone_id: int
    created_at: datetime


# ─── Route ───────────────────────────────────────────────────────────────────

class RouteCreate(BaseModel):
    name: str
    code: str
    zone_id: int
    division_id: int
    start_location: Optional[str] = None
    end_location: Optional[str] = None
    distance_km: Optional[float] = None


class RouteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    zone_id: int
    division_id: int
    start_location: Optional[str] = None
    end_location: Optional[str] = None
    distance_km: Optional[float] = None
    created_at: datetime


# ─── Vendor ──────────────────────────────────────────────────────────────────

class VendorCreate(BaseModel):
    name: str
    code: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    rating: float = 0.0
    is_active: bool = True


class VendorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    rating: float
    is_active: bool
    created_at: datetime


# ─── FittingType ─────────────────────────────────────────────────────────────

class FittingTypeCreate(BaseModel):
    name: str
    code: str
    category: Optional[str] = None
    expected_life_years: Optional[int] = None
    description: Optional[str] = None


class FittingTypeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    category: Optional[str] = None
    expected_life_years: Optional[int] = None
    description: Optional[str] = None


# ─── TrackFitting ────────────────────────────────────────────────────────────

class TrackFittingCreate(BaseModel):
    fitting_code: str
    fitting_type_id: int
    vendor_id: int
    batch_number: Optional[str] = None
    manufacturing_date: Optional[datetime] = None
    installation_date: Optional[datetime] = None
    zone_id: int
    division_id: int
    route_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    status: str = "HEALTHY"
    health_score: float = 100.0
    service_life_years: Optional[int] = None
    last_inspection_date: Optional[datetime] = None
    next_inspection_date: Optional[datetime] = None


class TrackFittingUpdate(BaseModel):
    fitting_type_id: Optional[int] = None
    vendor_id: Optional[int] = None
    batch_number: Optional[str] = None
    manufacturing_date: Optional[datetime] = None
    installation_date: Optional[datetime] = None
    zone_id: Optional[int] = None
    division_id: Optional[int] = None
    route_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    status: Optional[str] = None
    health_score: Optional[float] = None
    service_life_years: Optional[int] = None
    last_inspection_date: Optional[datetime] = None
    next_inspection_date: Optional[datetime] = None


class TrackFittingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fitting_code: str
    fitting_type_id: int
    vendor_id: int
    batch_number: Optional[str] = None
    manufacturing_date: Optional[datetime] = None
    installation_date: Optional[datetime] = None
    zone_id: int
    division_id: int
    route_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    status: str
    health_score: float
    service_life_years: Optional[int] = None
    last_inspection_date: Optional[datetime] = None
    next_inspection_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class TrackFittingDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fitting_code: str
    fitting_type_id: int
    fitting_type_name: Optional[str] = None
    vendor_id: int
    vendor_name: Optional[str] = None
    batch_number: Optional[str] = None
    manufacturing_date: Optional[datetime] = None
    installation_date: Optional[datetime] = None
    zone_id: int
    zone_name: Optional[str] = None
    division_id: int
    division_name: Optional[str] = None
    route_id: int
    route_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    status: str
    health_score: float
    service_life_years: Optional[int] = None
    last_inspection_date: Optional[datetime] = None
    next_inspection_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class FittingPassport(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    fitting: TrackFittingDetail
    qr_code: Optional[str] = None
    inspection_count: int = 0
    ticket_count: int = 0
    alert_count: int = 0
    recent_inspections: List[Any] = []
    recent_tickets: List[Any] = []


class TimelineEvent(BaseModel):
    event_type: str
    date: datetime
    title: str
    description: Optional[str] = None
    status: Optional[str] = None


# ─── QR Code ─────────────────────────────────────────────────────────────────

class QRGenerateRequest(BaseModel):
    fitting_id: int


class QRGenerateResponse(BaseModel):
    fitting_id: int
    fitting_code: str
    qr_data: str
    qr_image_base64: str
    qr_image_path: str
    version: int


class QRVerifyRequest(BaseModel):
    qr_data: str


class QRVerifyResponse(BaseModel):
    valid: bool
    fitting_code: Optional[str] = None
    fitting_id: Optional[int] = None


class QRInfoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fitting_id: int
    qr_data: str
    qr_image_path: Optional[str] = None
    version: int
    created_at: datetime
    is_active: bool


# ─── Inspection ──────────────────────────────────────────────────────────────

class InspectionCreate(BaseModel):
    fitting_id: int
    inspector_id: int
    scheduled_date: Optional[datetime] = None
    status: str = "SCHEDULED"
    visual_condition: Optional[str] = None
    wear_level: Optional[int] = None
    corrosion_level: Optional[int] = None
    damage_type: Optional[str] = None
    photo_url: Optional[str] = None
    remarks: Optional[str] = None
    recommended_action: Optional[str] = None
    health_score: Optional[float] = None


class InspectionUpdate(BaseModel):
    status: Optional[str] = None
    visual_condition: Optional[str] = None
    wear_level: Optional[int] = None
    corrosion_level: Optional[int] = None
    damage_type: Optional[str] = None
    photo_url: Optional[str] = None
    remarks: Optional[str] = None
    recommended_action: Optional[str] = None
    health_score: Optional[float] = None
    completed_date: Optional[datetime] = None


class InspectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inspection_code: str
    fitting_id: int
    inspector_id: int
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    status: str
    visual_condition: Optional[str] = None
    wear_level: Optional[int] = None
    corrosion_level: Optional[int] = None
    damage_type: Optional[str] = None
    photo_url: Optional[str] = None
    remarks: Optional[str] = None
    recommended_action: Optional[str] = None
    health_score: Optional[float] = None
    created_at: datetime


# ─── Maintenance ─────────────────────────────────────────────────────────────

class MaintenanceTicketCreate(BaseModel):
    fitting_id: int
    assigned_to: Optional[int] = None
    priority: str = "MEDIUM"
    status: str = "SCHEDULED"
    issue_description: Optional[str] = None
    estimated_cost: Optional[float] = None
    due_date: Optional[datetime] = None


class MaintenanceTicketUpdate(BaseModel):
    assigned_to: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    issue_description: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    due_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    notes: Optional[str] = None


class MaintenanceTicketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_code: str
    fitting_id: int
    assigned_to: Optional[int] = None
    priority: str
    status: str
    issue_description: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    created_at: datetime
    due_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None


class MaintenanceHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: int
    changed_by: int
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


# ─── Alert ───────────────────────────────────────────────────────────────────

class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    alert_code: str
    fitting_id: int
    alert_type: str
    severity: str
    title: str
    description: Optional[str] = None
    is_acknowledged: bool
    acknowledged_by: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    is_resolved: bool
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime


# ─── AI Insight ──────────────────────────────────────────────────────────────

class AIInsightRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fitting_id: Optional[int] = None
    insight_type: str
    title: str
    description: Optional[str] = None
    risk_score: Optional[float] = None
    confidence: Optional[float] = None
    factors: Optional[str] = None
    recommended_action: Optional[str] = None
    is_read: bool
    created_at: datetime


class RiskAnalysisResponse(BaseModel):
    fitting_id: int
    fitting_code: str
    risk_score: float
    risk_level: str
    health_score: float
    factors: dict = {}
    recommended_actions: List[str] = []
    confidence: float = 0.0
    model_version: str = "Decision Support / Prototype Prediction"


class ForecastItem(BaseModel):
    fitting_id: int
    fitting_code: str
    zone_name: Optional[str] = None
    type_name: Optional[str] = None
    predicted_maintenance_date: Optional[datetime] = None
    current_health_score: float
    risk_score: float
    priority: str
    estimated_cost: Optional[float] = None


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardSummary(BaseModel):
    total_fittings: int = 0
    healthy_count: int = 0
    attention_count: int = 0
    critical_count: int = 0
    under_maintenance_count: int = 0
    retired_count: int = 0
    total_inspections: int = 0
    pending_inspections: int = 0
    overdue_inspections: int = 0
    open_tickets: int = 0
    critical_alerts: int = 0
    active_alerts: int = 0
    avg_health_score: float = 0.0
    total_zones: int = 0
    total_vendors: int = 0


class HealthDistribution(BaseModel):
    label: str
    count: int
    percentage: float


class TrendData(BaseModel):
    year: int
    healthy: int
    attention: int
    critical: int
    maintenance: int
    total_inspections: int
    avg_health: float


class AlertSummary(BaseModel):
    id: int
    alert_code: str
    title: str
    severity: str
    alert_type: str
    fitting_code: Optional[str] = None
    created_at: datetime
    is_acknowledged: bool
    is_resolved: bool


# ─── Pagination ──────────────────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


# ─── Reports ─────────────────────────────────────────────────────────────────

class AssetHealthReport(BaseModel):
    zone_name: str
    total_fittings: int
    avg_health_score: float
    healthy_pct: float
    attention_pct: float
    critical_pct: float
    oldest_fitting_age: Optional[float] = None


class MaintenanceReport(BaseModel):
    zone_name: str
    total_tickets: int
    completed: int
    in_progress: int
    overdue: int
    avg_completion_days: Optional[float] = None
    total_cost: float


class InspectionComplianceReport(BaseModel):
    zone_name: str
    total_scheduled: int
    completed: int
    compliance_rate: float
    overdue_count: int


class VendorQualityReport(BaseModel):
    vendor_name: str
    total_fittings: int
    avg_health_score: float
    avg_rating: float
    defect_rate: float


class ZonePerformanceReport(BaseModel):
    zone_name: str
    total_fittings: int
    avg_health: float
    inspection_compliance: float
    maintenance_efficiency: float
    critical_alerts: int


# Map markers
class MapMarker(BaseModel):
    id: int
    fitting_code: str
    latitude: float
    longitude: float
    status: str
    health_score: float
    fitting_type: Optional[str] = None
    location_name: Optional[str] = None


class MapRoute(BaseModel):
    id: int
    name: str
    code: str
    start_location: Optional[str] = None
    end_location: Optional[str] = None
    fittings_count: int = 0
    latitudes: List[float] = []
    longitudes: List[float] = []

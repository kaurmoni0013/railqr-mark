import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    RAILWAY_OFFICER = "RAILWAY_OFFICER"
    INSPECTOR = "INSPECTOR"
    MAINTENANCE_ENGINEER = "MAINTENANCE_ENGINEER"
    VIEWER = "VIEWER"


class FittingStatus(str, enum.Enum):
    HEALTHY = "HEALTHY"
    ATTENTION = "ATTENTION"
    CRITICAL = "CRITICAL"
    UNDER_MAINTENANCE = "UNDER_MAINTENANCE"
    RETIRED = "RETIRED"


class VisualCondition(str, enum.Enum):
    EXCELLENT = "EXCELLENT"
    GOOD = "GOOD"
    FAIR = "FAIR"
    POOR = "POOR"
    CRITICAL = "CRITICAL"


class InspectionStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"


class TicketPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TicketStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CLOSED = "CLOSED"


class AlertType(str, enum.Enum):
    WEAR = "WEAR"
    CORROSION = "CORROSION"
    OVERDUE_INSPECTION = "OVERDUE_INSPECTION"
    MAINTENANCE_DUE = "MAINTENANCE_DUE"
    CRITICAL_RISK = "CRITICAL_RISK"
    QR_DAMAGE = "QR_DAMAGE"


class AlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=UserRole.VIEWER.value)
    zone_id = Column(Integer, ForeignKey("railway_zones.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("RailwayZone", back_populates="users")
    inspections = relationship("Inspection", back_populates="inspector", foreign_keys="Inspection.inspector_id")
    assigned_tickets = relationship("MaintenanceTicket", back_populates="assignee", foreign_keys="MaintenanceTicket.assigned_to")


class RailwayZone(Base):
    __tablename__ = "railway_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    region = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="zone")
    divisions = relationship("Division", back_populates="zone")
    routes = relationship("Route", back_populates="zone")
    fittings = relationship("TrackFitting", back_populates="zone")


class Division(Base):
    __tablename__ = "divisions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    zone_id = Column(Integer, ForeignKey("railway_zones.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("RailwayZone", back_populates="divisions")
    routes = relationship("Route", back_populates="division")
    fittings = relationship("TrackFitting", back_populates="division")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    zone_id = Column(Integer, ForeignKey("railway_zones.id"), nullable=False)
    division_id = Column(Integer, ForeignKey("divisions.id"), nullable=False)
    start_location = Column(String(255), nullable=True)
    end_location = Column(String(255), nullable=True)
    distance_km = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("RailwayZone", back_populates="routes")
    division = relationship("Division", back_populates="routes")
    fittings = relationship("TrackFitting", back_populates="route")


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    rating = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    fittings = relationship("TrackFitting", back_populates="vendor")


class FittingType(Base):
    __tablename__ = "fitting_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    category = Column(String(100), nullable=True)
    expected_life_years = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)

    fittings = relationship("TrackFitting", back_populates="fitting_type")


class TrackFitting(Base):
    __tablename__ = "track_fittings"

    id = Column(Integer, primary_key=True, index=True)
    fitting_code = Column(String(100), unique=True, index=True, nullable=False)
    fitting_type_id = Column(Integer, ForeignKey("fitting_types.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    batch_number = Column(String(100), nullable=True)
    manufacturing_date = Column(DateTime, nullable=True)
    installation_date = Column(DateTime, nullable=True)
    zone_id = Column(Integer, ForeignKey("railway_zones.id"), nullable=False)
    division_id = Column(Integer, ForeignKey("divisions.id"), nullable=False)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(255), nullable=True)
    status = Column(String(50), default=FittingStatus.HEALTHY.value)
    health_score = Column(Float, default=100.0)
    service_life_years = Column(Integer, nullable=True)
    last_inspection_date = Column(DateTime, nullable=True)
    next_inspection_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    fitting_type = relationship("FittingType", back_populates="fittings")
    vendor = relationship("Vendor", back_populates="fittings")
    zone = relationship("RailwayZone", back_populates="fittings")
    division = relationship("Division", back_populates="fittings")
    route = relationship("Route", back_populates="fittings")
    qr_codes = relationship("QRCode", back_populates="fitting")
    inspections = relationship("Inspection", back_populates="fitting")
    maintenance_tickets = relationship("MaintenanceTicket", back_populates="fitting")
    alerts = relationship("Alert", back_populates="fitting")
    ai_insights = relationship("AIInsight", back_populates="fitting")


class QRCode(Base):
    __tablename__ = "qr_codes"

    id = Column(Integer, primary_key=True, index=True)
    fitting_id = Column(Integer, ForeignKey("track_fittings.id"), nullable=False)
    qr_data = Column(String(500), nullable=False)
    qr_image_path = Column(String(500), nullable=True)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    fitting = relationship("TrackFitting", back_populates="qr_codes")


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    inspection_code = Column(String(100), unique=True, index=True, nullable=False)
    fitting_id = Column(Integer, ForeignKey("track_fittings.id"), nullable=False)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheduled_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    status = Column(String(50), default=InspectionStatus.SCHEDULED.value)
    visual_condition = Column(String(50), nullable=True)
    wear_level = Column(Integer, nullable=True)
    corrosion_level = Column(Integer, nullable=True)
    damage_type = Column(String(100), nullable=True)
    photo_url = Column(String(500), nullable=True)
    remarks = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    health_score = Column(Float, nullable=True)
    completed_by_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    fitting = relationship("TrackFitting", back_populates="inspections")
    inspector = relationship("User", back_populates="inspections", foreign_keys=[inspector_id])


class MaintenanceTicket(Base):
    __tablename__ = "maintenance_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_code = Column(String(100), unique=True, index=True, nullable=False)
    fitting_id = Column(Integer, ForeignKey("track_fittings.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    priority = Column(String(50), default=TicketPriority.MEDIUM.value)
    status = Column(String(50), default=TicketStatus.SCHEDULED.value)
    issue_description = Column(Text, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    actual_cost = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    completed_by_email = Column(String(255), nullable=True)

    fitting = relationship("TrackFitting", back_populates="maintenance_tickets")
    assignee = relationship("User", back_populates="assigned_tickets", foreign_keys=[assigned_to])
    history = relationship("MaintenanceHistory", back_populates="ticket")


class MaintenanceHistory(Base):
    __tablename__ = "maintenance_history"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("maintenance_tickets.id"), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("MaintenanceTicket", back_populates="history")
    changer = relationship("User", foreign_keys=[changed_by])


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String(100), unique=True, index=True, nullable=False)
    fitting_id = Column(Integer, ForeignKey("track_fittings.id"), nullable=False)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(50), default=AlertSeverity.LOW.value)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    fitting = relationship("TrackFitting", back_populates="alerts")
    ack_user = relationship("User", foreign_keys=[acknowledged_by])
    res_user = relationship("User", foreign_keys=[resolved_by])


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    fitting_id = Column(Integer, ForeignKey("track_fittings.id"), nullable=True)
    insight_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    risk_score = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    factors = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    fitting = relationship("TrackFitting", back_populates="ai_insights")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])

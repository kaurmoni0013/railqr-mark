export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'RAILWAY_OFFICER' | 'INSPECTOR' | 'MAINTENANCE_ENGINEER' | 'VIEWER';
  zone_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RailwayZone {
  id: number;
  name: string;
  code: string;
  region: string | null;
  created_at: string;
}

export interface Division {
  id: number;
  name: string;
  code: string;
  zone_id: number;
  created_at: string;
}

export interface Vendor {
  id: number;
  name: string;
  code: string;
  contact_email: string | null;
  contact_phone: string | null;
  rating: number;
  is_active: boolean;
  created_at: string;
}

export interface FittingType {
  id: number;
  name: string;
  code: string;
  category: string | null;
  expected_life_years: number | null;
  description: string | null;
}

export interface TrackFitting {
  id: number;
  fitting_code: string;
  fitting_type_id: number;
  vendor_id: number;
  batch_number: string | null;
  manufacturing_date: string | null;
  installation_date: string | null;
  zone_id: number;
  division_id: number;
  route_id: number;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  status: 'HEALTHY' | 'ATTENTION' | 'CRITICAL' | 'UNDER_MAINTENANCE' | 'RETIRED';
  health_score: number;
  service_life_years: number | null;
  last_inspection_date: string | null;
  next_inspection_date: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface TrackFittingDetail extends TrackFitting {
  fitting_type_name: string | null;
  vendor_name: string | null;
  zone_name: string | null;
  division_name: string | null;
  route_name: string | null;
}

export interface Inspection {
  id: number;
  inspection_code: string;
  fitting_id: number;
  inspector_id: number;
  scheduled_date: string | null;
  completed_date: string | null;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  visual_condition: string | null;
  wear_level: number | null;
  corrosion_level: number | null;
  damage_type: string | null;
  photo_url: string | null;
  remarks: string | null;
  recommended_action: string | null;
  health_score: number | null;
  created_at: string;
}

export interface MaintenanceTicket {
  id: number;
  ticket_code: string;
  fitting_id: number;
  assigned_to: number | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SCHEDULED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
  issue_description: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  created_at: string;
  due_date: string | null;
  completed_date: string | null;
}

export interface Alert {
  id: number;
  alert_code: string;
  fitting_id: number;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string | null;
  is_acknowledged: boolean;
  acknowledged_by: number | null;
  acknowledged_at: string | null;
  is_resolved: boolean;
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AIInsight {
  id: number;
  fitting_id: number | null;
  insight_type: string;
  title: string;
  description: string | null;
  risk_score: number | null;
  confidence: number | null;
  factors: string | null;
  recommended_action: string | null;
  is_read: boolean;
  created_at: string;
}

export interface DashboardSummary {
  total_fittings: number;
  healthy_count: number;
  attention_count: number;
  critical_count: number;
  under_maintenance_count: number;
  retired_count: number;
  total_inspections: number;
  pending_inspections: number;
  overdue_inspections: number;
  open_tickets: number;
  critical_alerts: number;
  active_alerts: number;
  avg_health_score: number;
  total_zones: number;
  total_vendors: number;
}

export interface HealthDistribution {
  label: string;
  count: number;
  percentage: number;
}

export interface TrendData {
  year: number;
  healthy: number;
  attention: number;
  critical: number;
  maintenance: number;
  total_inspections: number;
  avg_health: number;
}

export interface AlertSummary {
  id: number;
  alert_code: string;
  title: string;
  severity: string;
  alert_type: string;
  fitting_code: string | null;
  created_at: string;
  is_acknowledged: boolean;
  is_resolved: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RiskAnalysis {
  fitting_id: number;
  fitting_code: string;
  risk_score: number;
  risk_level: string;
  health_score: number;
  factors: Record<string, number>;
  recommended_actions: string[];
  confidence: number;
  model_version: string;
}

export interface ForecastItem {
  fitting_id: number;
  fitting_code: string;
  zone_name: string | null;
  type_name: string | null;
  predicted_maintenance_date: string | null;
  current_health_score: number;
  risk_score: number;
  priority: string;
  estimated_cost: number | null;
}

export interface TimelineEvent {
  event_type: string;
  date: string;
  title: string;
  description: string | null;
  status: string | null;
}

export interface MapMarker {
  id: number;
  fitting_code: string;
  latitude: number;
  longitude: number;
  status: string;
  health_score: number;
  fitting_type: string | null;
  location_name: string | null;
}

export interface MapRoute {
  id: number;
  name: string;
  code: string;
  start_location: string | null;
  end_location: string | null;
  fittings_count: number;
  latitudes: number[];
  longitudes: number[];
}

export interface QRGenerateResponse {
  fitting_id: number;
  fitting_code: string;
  qr_data: string;
  qr_image_base64: string;
  qr_image_path: string;
  version: number;
}

export interface AssetHealthReport {
  zone_name: string;
  total_fittings: number;
  avg_health_score: number;
  healthy_pct: number;
  attention_pct: number;
  critical_pct: number;
  oldest_fitting_age: number | null;
}

export interface MaintenanceReport {
  zone_name: string;
  total_tickets: number;
  completed: number;
  in_progress: number;
  overdue: number;
  avg_completion_days: number | null;
  total_cost: number;
}

export interface TrackFittingCreate {
  fitting_code: string;
  fitting_type_id: number;
  vendor_id: number;
  batch_number?: string | null;
  manufacturing_date?: string | null;
  installation_date?: string | null;
  zone_id: number;
  division_id: number;
  route_id: number;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  status?: string;
  health_score?: number;
  service_life_years?: number | null;
  last_inspection_date?: string | null;
  next_inspection_date?: string | null;
}

export interface TrackFittingUpdate {
  fitting_type_id?: number;
  vendor_id?: number;
  batch_number?: string | null;
  manufacturing_date?: string | null;
  installation_date?: string | null;
  zone_id?: number;
  division_id?: number;
  route_id?: number;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  status?: string;
  health_score?: number;
  service_life_years?: number | null;
  last_inspection_date?: string | null;
  next_inspection_date?: string | null;
}

export interface InspectionCreate {
  fitting_id: number;
  inspector_id: number;
  scheduled_date?: string | null;
  status?: string;
  visual_condition?: string | null;
  wear_level?: number | null;
  corrosion_level?: number | null;
  damage_type?: string | null;
  photo_url?: string | null;
  remarks?: string | null;
  recommended_action?: string | null;
  health_score?: number | null;
}

export interface InspectionUpdate {
  status?: string;
  visual_condition?: string | null;
  wear_level?: number | null;
  corrosion_level?: number | null;
  damage_type?: string | null;
  photo_url?: string | null;
  remarks?: string | null;
  recommended_action?: string | null;
  health_score?: number | null;
  completed_date?: string | null;
}

export interface MaintenanceTicketCreate {
  fitting_id: number;
  assigned_to?: number | null;
  priority?: string;
  status?: string;
  issue_description?: string | null;
  estimated_cost?: number | null;
  due_date?: string | null;
}

export interface MaintenanceTicketUpdate {
  assigned_to?: number | null;
  priority?: string;
  status?: string;
  issue_description?: string | null;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  due_date?: string | null;
  completed_date?: string | null;
  notes?: string | null;
}

export interface MaintenanceHistory {
  id: number;
  ticket_id: number;
  changed_by: number;
  old_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
}

export interface InspectionComplianceReport {
  zone_name: string;
  total_scheduled: number;
  completed: number;
  compliance_rate: number;
  overdue_count: number;
}

export interface VendorQualityReport {
  vendor_name: string;
  total_fittings: number;
  avg_health_score: number;
  avg_rating: number;
  defect_rate: number;
}

export interface ZonePerformanceReport {
  zone_name: string;
  total_fittings: number;
  avg_health: number;
  inspection_compliance: number;
  maintenance_efficiency: number;
  critical_alerts: number;
}

export interface QRVerifyResponse {
  valid: boolean;
  fitting_code: string | null;
  fitting_id: number | null;
}

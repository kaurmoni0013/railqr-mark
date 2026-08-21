import type {
  User,
  TokenResponse,
  LoginRequest,
  DashboardSummary,
  HealthDistribution,
  TrendData,
  AlertSummary,
  PaginatedResponse,
  TrackFitting,
  TrackFittingDetail,
  TrackFittingCreate,
  TrackFittingUpdate,
  Inspection,
  InspectionCreate,
  InspectionUpdate,
  MaintenanceTicket,
  MaintenanceTicketCreate,
  MaintenanceTicketUpdate,
  MaintenanceHistory,
  Alert,
  AIInsight,
  RiskAnalysis,
  ForecastItem,
  MapMarker,
  MapRoute,
  TimelineEvent,
  QRGenerateResponse,
  AssetHealthReport,
  MaintenanceReport,
  RailwayZone,
  Division,
  Vendor,
  FittingType,
  InspectionComplianceReport,
  VendorQualityReport,
  ZonePerformanceReport,
  QRVerifyResponse,
} from '@/types';

const API_BASE = '/api';
const TOKEN_KEY = 'railqr_token';
const USER_KEY = 'railqr_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuth();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${url.split('/').pop() || 'report'}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return blob as unknown as T;
  }

  return response.json();
}

function buildQueryString(params?: Record<string, string | number | boolean | null | undefined>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const api = {
  auth: {
    login: (credentials: LoginRequest) =>
      request<TokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    me: () => request<User>('/auth/me'),
  },

  dashboard: {
    summary: () => request<DashboardSummary>('/dashboard/summary'),
    trends: () => request<TrendData[]>('/dashboard/trends'),
    healthDistribution: () => request<HealthDistribution[]>('/dashboard/health-distribution'),
    alerts: () => request<AlertSummary[]>('/dashboard/alerts'),
  },

  fittings: {
    list: (params?: Record<string, string | number | boolean | null | undefined>) =>
      request<PaginatedResponse<TrackFitting>>(`/fittings${buildQueryString(params)}`),
    get: (id: number) =>
      request<TrackFittingDetail>(`/fittings/${id}`),
    create: (data: TrackFittingCreate) =>
      request<TrackFitting>('/fittings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: TrackFittingUpdate) =>
      request<TrackFitting>(`/fittings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    passport: (id: number) =>
      request<any>(`/fittings/${id}/passport`),
    timeline: (id: number) =>
      request<TimelineEvent[]>(`/fittings/${id}/timeline`),
  },

  qr: {
    generate: (fitting_id: number) =>
      request<QRGenerateResponse>('/qr/generate', {
        method: 'POST',
        body: JSON.stringify({ fitting_id }),
      }),
    verify: (qrData: string) =>
      request<QRVerifyResponse>('/qr/verify', {
        method: 'POST',
        body: JSON.stringify({ qr_data: qrData }),
      }),
    info: (fitting_id: number) =>
      request<any>(`/qr/${fitting_id}`),
  },

  inspections: {
    list: (params?: Record<string, string | number | boolean | null | undefined>) =>
      request<PaginatedResponse<Inspection>>(`/inspections${buildQueryString(params)}`),
    get: (id: number) =>
      request<Inspection>(`/inspections/${id}`),
    create: (data: InspectionCreate) =>
      request<Inspection>('/inspections', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: InspectionUpdate) =>
      request<Inspection>(`/inspections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  maintenance: {
    list: (params?: Record<string, string | number | boolean | null | undefined>) =>
      request<PaginatedResponse<MaintenanceTicket>>(`/maintenance${buildQueryString(params)}`),
    create: (data: MaintenanceTicketCreate) =>
      request<MaintenanceTicket>('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: MaintenanceTicketUpdate) =>
      request<MaintenanceTicket>(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    history: (id: number) =>
      request<MaintenanceHistory[]>(`/maintenance/${id}/history`),
  },

  alerts: {
    list: (params?: Record<string, string | number | boolean | null | undefined>) =>
      request<PaginatedResponse<Alert>>(`/alerts${buildQueryString(params)}`),
    acknowledge: (id: number) =>
      request<Alert>(`/alerts/${id}/acknowledge`, { method: 'POST' }),
    resolve: (id: number) =>
      request<Alert>(`/alerts/${id}/resolve`, { method: 'POST' }),
  },

  ai: {
    risk: (fitting_id: number) =>
      request<RiskAnalysis>(`/ai/risk/${fitting_id}`),
    insights: (params?: Record<string, string | number | boolean | null | undefined>) =>
      request<PaginatedResponse<AIInsight>>(`/ai/insights${buildQueryString(params)}`),
    forecast: (params?: Record<string, string | number | boolean | null | undefined>) =>
      request<ForecastItem[]>(`/ai/forecast${buildQueryString(params)}`),
  },

  reports: {
    assetHealth: () => request<AssetHealthReport[]>('/reports/asset-health'),
    maintenance: () => request<MaintenanceReport[]>('/reports/maintenance'),
    inspectionCompliance: () => request<InspectionComplianceReport[]>('/reports/inspection-compliance'),
    vendorQuality: () => request<VendorQualityReport[]>('/reports/vendor-quality'),
    zonePerformance: () => request<ZonePerformanceReport[]>('/reports/zone-performance'),
    export: (type: string) => request<Blob>(`/reports/export/${type}`),
  },

  maps: {
    markers: (params?: Record<string, string | number | boolean | null | undefined>) =>
      request<MapMarker[]>(`/maps/markers${buildQueryString(params)}`),
    routes: (params?: Record<string, string | number | boolean | null | undefined>) =>
      request<MapRoute[]>(`/maps/routes${buildQueryString(params)}`),
  },

  zones: {
    list: () => request<RailwayZone[]>('/zones'),
  },

  divisions: {
    list: (params?: Record<string, string | number | boolean | null | undefined>) =>
      request<Division[]>(`/divisions${buildQueryString(params)}`),
  },

  vendors: {
    list: () => request<Vendor[]>('/vendors'),
  },

  fittingTypes: {
    list: () => request<FittingType[]>('/fitting-types'),
  },
};

export default api;

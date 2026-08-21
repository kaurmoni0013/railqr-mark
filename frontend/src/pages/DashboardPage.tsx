import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  MapPin,
  Brain,
  Eye,
  Bell,
  ChevronRight,
  Clock,
  Shield,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { format } from 'date-fns';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import type {
  DashboardSummary,
  TrendData,
  HealthDistribution,
  AlertSummary,
  MapMarker,
  AIInsight,
  Inspection,
  PaginatedResponse,
} from '@/types';

function useAnimatedCount(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 64;
  const h = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function getMarkerIcon(status: string) {
  const colors: Record<string, string> = {
    HEALTHY: '#16A34A',
    ATTENTION: '#F59E0B',
    CRITICAL: '#DC2626',
    UNDER_MAINTENANCE: '#8B5CF6',
  };
  const color = colors[status] || '#64748B';
  return L.divIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 6px ${color}80;"></div>`,
  });
}

const PIE_COLORS: Record<string, string> = {
  Healthy: '#16A34A',
  Attention: '#F59E0B',
  Critical: '#DC2626',
  Maintenance: '#8B5CF6',
};

const trendTabs = [
  { key: 'maintenance', label: 'Maintenance Activity' },
  { key: 'inspection', label: 'Inspection Volume' },
  { key: 'defect', label: 'Defect Rate' },
] as const;

type TrendTab = typeof trendTabs[number]['key'];

function KPICardSkeleton() {
  return (
    <div className="glass-card p-5">
      <div className="skeleton h-4 w-20 mb-3" />
      <div className="skeleton h-8 w-16 mb-2" />
      <div className="skeleton h-3 w-24" />
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [healthDist, setHealthDist] = useState<HealthDistribution[]>([]);
  const [alerts, setAlerts] = useState<AlertSummary[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [inspections, setInspections] = useState<PaginatedResponse<Inspection> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendTab, setTrendTab] = useState<TrendTab>('maintenance');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [s, t, h, a, m, ai, insp] = await Promise.allSettled([
        api.dashboard.summary(),
        api.dashboard.trends(),
        api.dashboard.healthDistribution(),
        api.dashboard.alerts(),
        api.maps.markers(),
        api.ai.insights({ page_size: 5 }),
        api.inspections.list({ page_size: 8 }),
      ]);
      if (s.status === 'fulfilled') setSummary(s.value);
      if (t.status === 'fulfilled') setTrends(t.value);
      if (h.status === 'fulfilled') setHealthDist(h.value);
      if (a.status === 'fulfilled') setAlerts(a.value);
      if (m.status === 'fulfilled') setMarkers(m.value);
      if (ai.status === 'fulfilled') setInsights(ai.value.items);
      if (insp.status === 'fulfilled') setInspections(insp.value);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalFittings = useAnimatedCount(summary?.total_fittings ?? 0);
  const totalInspections = useAnimatedCount(summary?.total_inspections ?? 0);
  const openTickets = useAnimatedCount(summary?.open_tickets ?? 0);
  const criticalAlerts = useAnimatedCount(summary?.critical_alerts ?? 0);

  const kpiCards = [
    {
      label: 'Total Track Fittings',
      value: totalFittings,
      change: summary ? ((summary.healthy_count / (summary.total_fittings || 1)) * 100).toFixed(1) : '0',
      changeDir: 'up' as const,
      icon: Activity,
      color: '#0B5CAB',
      sparkData: [totalFittings * 0.6, totalFittings * 0.7, totalFittings * 0.8, totalFittings * 0.9, totalFittings],
      path: '/fittings',
    },
    {
      label: 'Inspections Completed',
      value: totalInspections,
      change: summary ? (((summary.total_inspections - summary.pending_inspections) / (summary.total_inspections || 1)) * 100).toFixed(1) : '0',
      changeDir: 'up' as const,
      icon: CheckCircle2,
      color: '#16A34A',
      sparkData: [totalInspections * 0.4, totalInspections * 0.6, totalInspections * 0.7, totalInspections * 0.85, totalInspections],
      path: '/inspections',
    },
    {
      label: 'Pending Maintenance',
      value: openTickets,
      change: summary ? ((summary.open_tickets / (summary.total_fittings || 1)) * 100).toFixed(1) : '0',
      changeDir: 'up' as const,
      icon: Wrench,
      color: '#F59E0B',
      sparkData: [openTickets * 1.2, openTickets * 1.1, openTickets * 0.9, openTickets * 1.05, openTickets],
      path: '/maintenance',
    },
    {
      label: 'Critical Alerts',
      value: criticalAlerts,
      change: summary ? ((summary.critical_alerts / (summary.active_alerts || 1)) * 100).toFixed(1) : '0',
      changeDir: criticalAlerts > 0 ? 'up' : 'down',
      icon: AlertTriangle,
      color: '#DC2626',
      sparkData: [criticalAlerts + 3, criticalAlerts + 1, criticalAlerts + 2, criticalAlerts, criticalAlerts],
      path: '/alerts',
    },
  ];

  const getTrendData = () => {
    return trends.map((t) => {
      switch (trendTab) {
        case 'maintenance':
          return { year: t.year, value: t.maintenance, name: 'Maintenance' };
        case 'inspection':
          return { year: t.year, value: t.total_inspections, name: 'Inspections' };
        case 'defect':
          return { year: t.year, value: t.critical + t.attention, name: 'Defects' };
        default:
          return { year: t.year, value: 0, name: '' };
      }
    });
  };

  const pieData = healthDist.map((h) => ({
    name: h.label,
    value: h.count,
    color: PIE_COLORS[h.label] || '#64748B',
  }));

  const severityDot = (severity: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-red-500',
      HIGH: 'bg-red-400',
      MEDIUM: 'bg-amber-400',
      LOW: 'bg-blue-400',
    };
    return colors[severity] || 'bg-slate-400';
  };

  const insightIcon = (type: string) => {
    switch (type) {
      case 'WEAR': return TrendingDown;
      case 'CORROSION': return AlertTriangle;
      case 'PREDICTION': return Brain;
      default: return Shield;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-10 w-64 mb-2" />
        <div className="skeleton h-4 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 glass-card-static p-5"><TableSkeleton rows={4} /></div>
          <div className="glass-card-static p-5"><TableSkeleton rows={4} /></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="glass-card-static p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-lg font-semibold text-slate-700 mb-2">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-rail-blue text-white rounded-lg text-sm hover:bg-rail-blue/90 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-slate-800">{getGreeting()}, Railway Officer</h1>
        <p className="text-sm text-rail-steel mt-1">Real-time overview of track fitting health and maintenance intelligence.</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="glass-card p-5 cursor-pointer group"
            onClick={() => navigate(card.path)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg" style={{ background: `${card.color}15` }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <Sparkline data={card.sparkData} color={card.color} />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">{card.value.toLocaleString()}</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-rail-steel">{card.label}</span>
              <span className={`text-xs font-medium flex items-center gap-0.5 ${
                card.changeDir === 'up' ? 'text-green-600' : 'text-red-500'
              }`}>
                {card.changeDir === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {card.change}%
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 mt-2 group-hover:text-rail-blue transition-colors group-hover:translate-x-1 transform transition-transform" />
          </motion.div>
        ))}
      </div>

      {/* Row 2: Trends + Health Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2 glass-card-static p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">5-Year Maintenance Intelligence</h2>
            <div className="flex gap-1">
              {trendTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTrendTab(tab.key)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    trendTab === tab.key
                      ? 'bg-rail-blue text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={getTrendData()}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B5CAB" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0B5CAB" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="value" stroke="#0B5CAB" fill="url(#trendGrad)" strokeWidth={2} name="Count" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Health Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="glass-card-static p-5"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Asset Health Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                onClick={(_, idx) => {
                  const item = pieData[idx];
                  if (item) {
                    const statusMap: Record<string, string> = {
                      Healthy: 'HEALTHY',
                      Attention: 'ATTENTION',
                      Critical: 'CRITICAL',
                      Maintenance: 'UNDER_MAINTENANCE',
                    };
                    navigate(`/fittings?status=${statusMap[item.name] || ''}`);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                <span className="text-slate-600">{entry.name}</span>
                <span className="font-semibold text-slate-800 ml-auto">{entry.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Row 3: Map + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Railway Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="glass-card-static p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Railway Network Map</h2>
            <MapPin className="w-5 h-5 text-rail-steel" />
          </div>
          <div className="h-[300px] rounded-xl overflow-hidden">
            <MapContainer
              center={[20.5, 78.9]}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {markers.map((m) => (
                <Marker
                  key={m.id}
                  position={[m.latitude, m.longitude]}
                  icon={getMarkerIcon(m.status)}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{m.fitting_code}</div>
                      <div className="text-gray-600">{m.fitting_type || 'Unknown'}</div>
                      <div className="text-gray-600">{m.location_name || 'No location'}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`w-2 h-2 rounded-full ${
                          m.status === 'HEALTHY' ? 'bg-green-500' :
                          m.status === 'ATTENTION' ? 'bg-amber-500' :
                          m.status === 'CRITICAL' ? 'bg-red-500' : 'bg-slate-400'
                        }`} />
                        <span className="font-medium">{m.status}</span>
                        <span className="text-gray-500 ml-1">({m.health_score}%)</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="glass-card-static p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">AI Insights</h2>
            <Brain className="w-5 h-5 text-rail-steel" />
          </div>
          <div className="space-y-3">
            {insights.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No insights available</p>
            )}
            {insights.map((insight) => {
              const Icon = insightIcon(insight.insight_type);
              return (
                <div
                  key={insight.id}
                  className="p-3 rounded-lg bg-white/50 border border-slate-100 hover:border-rail-blue/20 transition-all cursor-pointer"
                  onClick={() => insight.fitting_id && navigate(`/fittings/${insight.fitting_id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-rail-blue/10 shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-rail-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800 truncate">{insight.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{insight.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        {insight.risk_score != null && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            insight.risk_score >= 70 ? 'bg-red-100 text-red-700' :
                            insight.risk_score >= 40 ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            Risk: {insight.risk_score}
                          </span>
                        )}
                        {insight.recommended_action && (
                          <span className="text-[10px] text-slate-500 truncate">{insight.recommended_action}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => navigate('/ai-insights')}
            className="w-full mt-3 text-xs font-medium text-rail-blue hover:text-rail-blue/80 flex items-center justify-center gap-1 transition-colors"
          >
            View All Insights <ChevronRight className="w-3 h-3" />
          </button>
        </motion.div>
      </div>

      {/* Row 4: Recent Inspections + Alert Center */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Inspections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="lg:col-span-3 glass-card-static p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Inspections</h2>
            <button
              onClick={() => navigate('/inspections')}
              className="text-xs font-medium text-rail-blue hover:text-rail-blue/80 flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Inspection ID</th>
                  <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Fitting ID</th>
                  <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Health</th>
                  <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {(inspections?.items || []).map((insp) => (
                  <tr
                    key={insp.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/fittings/${insp.fitting_id}`)}
                  >
                    <td className="py-2.5 font-mono text-xs text-rail-blue">{insp.inspection_code}</td>
                    <td className="py-2.5 font-mono text-xs text-slate-600">FIT-{insp.fitting_id}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        insp.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        insp.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        insp.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {insp.status}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {insp.health_score != null ? (
                        <span className={`font-semibold ${
                          insp.health_score >= 70 ? 'text-green-600' :
                          insp.health_score >= 40 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {insp.health_score}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-xs text-slate-500">
                      {insp.completed_date
                        ? format(new Date(insp.completed_date), 'dd MMM yyyy')
                        : insp.scheduled_date
                          ? format(new Date(insp.scheduled_date), 'dd MMM yyyy')
                          : '—'
                      }
                    </td>
                  </tr>
                ))}
                {(!inspections?.items || inspections.items.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-400">No recent inspections</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Live Alert Center */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
          className="lg:col-span-2 glass-card-static p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Live Alert Center</h2>
            <Bell className="w-5 h-5 text-rail-steel" />
          </div>
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
            {alerts.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No active alerts</p>
            )}
            {alerts.slice(0, 8).map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-white/50 border border-slate-100 hover:border-rail-blue/20 transition-all"
              >
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${severityDot(alert.severity)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs text-slate-800 truncate">{alert.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(alert.created_at), 'dd MMM, HH:mm')}
                      {alert.fitting_code && <span className="ml-1 font-mono">{alert.fitting_code}</span>}
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {!alert.is_acknowledged && (
                        <button
                          onClick={(e) => { e.stopPropagation(); api.alerts.acknowledge(alert.id).then(() => loadData()); }}
                          className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      {!alert.is_resolved && (
                        <button
                          onClick={(e) => { e.stopPropagation(); api.alerts.resolve(alert.id, user?.email).then(() => loadData()); }}
                          className="px-2 py-0.5 text-[10px] font-medium bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

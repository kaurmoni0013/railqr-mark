import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  MapPin,
  Calendar,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Gauge,
  QrCode,
  Factory,
  Route,
  ChevronRight,
  TrendingDown,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { api } from '@/services/api';
import type {
  TrackFittingDetail,
  TimelineEvent,
  Inspection,
  MaintenanceTicket,
  RiskAnalysis,
  PaginatedResponse,
} from '@/types';

type Tab = 'overview' | 'lifecycle' | 'inspections' | 'maintenance' | 'ai-risk';

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: Shield },
  { key: 'lifecycle', label: 'Lifecycle', icon: Clock },
  { key: 'inspections', label: 'Inspections', icon: CheckCircle2 },
  { key: 'maintenance', label: 'Maintenance', icon: Wrench },
  { key: 'ai-risk', label: 'AI Risk', icon: Brain },
];

const statusColor = (status: string) => {
  switch (status) {
    case 'HEALTHY': return 'bg-green-100 text-green-700 border-green-200';
    case 'ATTENTION': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
    case 'UNDER_MAINTENANCE': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'RETIRED': return 'bg-slate-100 text-slate-500 border-slate-200';
    default: return 'bg-slate-100 text-slate-500 border-slate-200';
  }
};

const timelineIcon = (eventType: string) => {
  switch (eventType) {
    case 'manufactured': return { icon: Factory, color: 'text-blue-500', bg: 'bg-blue-100' };
    case 'qr_generated': return { icon: QrCode, color: 'text-indigo-500', bg: 'bg-indigo-100' };
    case 'installed': return { icon: MapPin, color: 'text-green-500', bg: 'bg-green-100' };
    case 'inspected': return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100' };
    case 'maintained': return { icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-100' };
    default: return { icon: Activity, color: 'text-slate-500', bg: 'bg-slate-100' };
  }
};

function HealthGauge({ score }: { score: number }) {
  const radius = 54;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#16A34A' : score >= 40 ? '#F59E0B' : '#DC2626';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="#e2e8f0"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold" style={{ color }}>{score}</div>
        <div className="text-[10px] text-slate-500 uppercase">Health</div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-40 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <div className="skeleton h-60 rounded-xl" />
        <div className="skeleton h-60 rounded-xl" />
      </div>
    </div>
  );
}

export default function FittingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fittingId = Number(id);

  const [fitting, setFitting] = useState<TrackFittingDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [risk, setRisk] = useState<RiskAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  const loadFitting = useCallback(async () => {
    if (!fittingId) return;
    try {
      setLoading(true);
      const detail = await api.fittings.get(fittingId);
      setFitting(detail);
    } catch (err) {
      console.error('Failed to load fitting', err);
    } finally {
      setLoading(false);
    }
  }, [fittingId]);

  useEffect(() => { loadFitting(); }, [loadFitting]);

  const loadTabData = useCallback(async (tab: Tab) => {
    if (!fittingId) return;
    setTabLoading(true);
    try {
      switch (tab) {
        case 'lifecycle': {
          const events = await api.fittings.timeline(fittingId);
          setTimeline(events);
          break;
        }
        case 'inspections': {
          const result = await api.inspections.list({ fitting_id: fittingId, page_size: 50 });
          setInspections(result.items);
          break;
        }
        case 'maintenance': {
          const result = await api.maintenance.list({ fitting_id: fittingId, page_size: 50 });
          setTickets(result.items);
          break;
        }
        case 'ai-risk': {
          const riskData = await api.ai.risk(fittingId);
          setRisk(riskData);
          break;
        }
      }
    } catch (err) {
      console.error('Failed to load tab data', err);
    } finally {
      setTabLoading(false);
    }
  }, [fittingId]);

  useEffect(() => {
    if (activeTab !== 'overview') {
      loadTabData(activeTab);
    }
  }, [activeTab, loadTabData]);

  if (loading) return <DetailSkeleton />;
  if (!fitting) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="glass-card-static p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="text-lg font-semibold text-slate-700 mb-2">Fitting not found</p>
          <button onClick={() => navigate('/fittings')} className="px-4 py-2 bg-rail-blue text-white rounded-lg text-sm">
            Back to Fittings
          </button>
        </div>
      </div>
    );
  }

  const riskFactors = risk
    ? Object.entries(risk.factors).map(([name, score]) => ({ name, score }))
    : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => navigate('/fittings')}
          className="flex items-center gap-1 text-sm text-rail-steel hover:text-rail-blue transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Track Assets
        </button>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-800">{fitting.fitting_code}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor(fitting.status)}`}>
                {fitting.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-rail-steel">
              {fitting.fitting_type_name || `Type-${fitting.fitting_type_id}`} &middot; {fitting.zone_name || `Zone-${fitting.zone_id}`}
            </p>
          </div>
          <HealthGauge score={fitting.health_score} />
        </div>
      </motion.div>

      {/* QR Code placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card-static p-4 flex items-center gap-4"
      >
        <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
          <QrCode className="w-10 h-10 text-slate-300" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-700">Digital Passport QR</div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">RAILQR:{fitting.fitting_code}:V1</div>
        </div>
        <button
          onClick={() => navigate(`/qr-generate?fitting_id=${fitting.id}`)}
          className="px-3 py-1.5 text-xs font-medium bg-rail-blue/10 text-rail-blue rounded-lg hover:bg-rail-blue/20 transition-colors"
        >
          Generate QR
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-rail-blue text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {tabLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-lg" />)}
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="glass-card-static p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Factory className="w-4 h-4 text-blue-500" />
                    Manufacturing Details
                  </h3>
                  <div className="space-y-3">
                    <InfoRow label="Type" value={fitting.fitting_type_name || `Type-${fitting.fitting_type_id}`} />
                    <InfoRow label="Vendor" value={fitting.vendor_name || `Vendor-${fitting.vendor_id}`} />
                    <InfoRow label="Batch Number" value={fitting.batch_number || '—'} />
                    <InfoRow
                      label="Manufacturing Date"
                      value={fitting.manufacturing_date ? format(new Date(fitting.manufacturing_date), 'dd MMMM yyyy') : '—'}
                    />
                  </div>
                </div>
                <div className="glass-card-static p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-500" />
                    Installation Details
                  </h3>
                  <div className="space-y-3">
                    <InfoRow label="Zone" value={fitting.zone_name || `Zone-${fitting.zone_id}`} />
                    <InfoRow label="Division" value={fitting.division_name || `Division-${fitting.division_id}`} />
                    <InfoRow label="Route" value={fitting.route_name || `Route-${fitting.route_id}`} />
                    <InfoRow label="Location" value={fitting.location_name || '—'} />
                    <InfoRow
                      label="Installation Date"
                      value={fitting.installation_date ? format(new Date(fitting.installation_date), 'dd MMMM yyyy') : '—'}
                    />
                  </div>
                </div>
                <div className="glass-card-static p-5 lg:col-span-2">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-rail-blue" />
                    Service Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoBlock label="Service Life" value={fitting.service_life_years ? `${fitting.service_life_years} years` : '—'} />
                    <InfoBlock
                      label="Last Inspection"
                      value={fitting.last_inspection_date ? format(new Date(fitting.last_inspection_date), 'dd MMM yyyy') : '—'}
                    />
                    <InfoBlock
                      label="Next Inspection"
                      value={fitting.next_inspection_date ? format(new Date(fitting.next_inspection_date), 'dd MMM yyyy') : '—'}
                    />
                    <InfoBlock label="Health Score" value={`${fitting.health_score}/100`} />
                  </div>
                </div>
              </div>
            )}

            {/* Lifecycle Tab */}
            {activeTab === 'lifecycle' && (
              <div className="glass-card-static p-5">
                {timeline.length === 0 ? (
                  <div className="text-center py-12 text-sm text-slate-400">No lifecycle events recorded</div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />
                    <div className="space-y-6">
                      {timeline.map((event, idx) => {
                        const config = timelineIcon(event.event_type);
                        const Icon = config.icon;
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative flex items-start gap-4 pl-2"
                          >
                            <div className={`relative z-10 p-2 rounded-full ${config.bg} shrink-0`}>
                              <Icon className={`w-4 h-4 ${config.color}`} />
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-slate-800">{event.title}</span>
                                {event.status && (
                                  <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                                    event.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    event.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {event.status}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(event.date), 'dd MMMM yyyy, HH:mm')}
                              </div>
                              {event.description && (
                                <p className="text-xs text-slate-600 mt-1">{event.description}</p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Inspections Tab */}
            {activeTab === 'inspections' && (
              <div className="glass-card-static overflow-hidden">
                {inspections.length === 0 ? (
                  <div className="text-center py-12 text-sm text-slate-400">No inspections recorded</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Code</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Health</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Condition</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspections.map((insp) => (
                        <tr key={insp.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono text-xs text-rail-blue">{insp.inspection_code}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              insp.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                              insp.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                              insp.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {insp.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {insp.health_score != null ? (
                              <span className={`font-semibold ${
                                insp.health_score >= 70 ? 'text-green-600' :
                                insp.health_score >= 40 ? 'text-amber-600' : 'text-red-600'
                              }`}>{insp.health_score}</span>
                            ) : '—'}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">{insp.visual_condition || '—'}</td>
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {insp.completed_date ? format(new Date(insp.completed_date), 'dd MMM yyyy') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
              <div className="glass-card-static overflow-hidden">
                {tickets.length === 0 ? (
                  <div className="text-center py-12 text-sm text-slate-400">No maintenance tickets</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Ticket</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Priority</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Cost</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono text-xs text-rail-blue">{ticket.ticket_code}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              ticket.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                              ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                              ticket.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              ticket.status === 'COMPLETED' || ticket.status === 'CLOSED' ? 'bg-green-100 text-green-700' :
                              ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            {ticket.actual_cost != null ? `₹${ticket.actual_cost.toLocaleString()}` :
                             ticket.estimated_cost != null ? `~₹${ticket.estimated_cost.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {ticket.due_date ? format(new Date(ticket.due_date), 'dd MMM yyyy') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* AI Risk Tab */}
            {activeTab === 'ai-risk' && (
              <div className="space-y-4">
                {risk ? (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Risk Score */}
                      <div className="glass-card-static p-5 text-center">
                        <Brain className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Risk Score</h3>
                        <div className="relative inline-flex items-center justify-center">
                          <svg height={100} width={100} className="-rotate-90">
                            <circle stroke="#e2e8f0" fill="transparent" strokeWidth={8} r={42} cx={50} cy={50} />
                            <circle
                              stroke={risk.risk_score >= 70 ? '#DC2626' : risk.risk_score >= 40 ? '#F59E0B' : '#16A34A'}
                              fill="transparent"
                              strokeWidth={8}
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                              strokeDashoffset={2 * Math.PI * 42 * (1 - risk.risk_score / 100)}
                              r={42}
                              cx={50}
                              cy={50}
                            />
                          </svg>
                          <div className="absolute">
                            <div className="text-2xl font-bold text-slate-800">{risk.risk_score}</div>
                          </div>
                        </div>
                        <div className={`mt-2 text-xs font-semibold px-2 py-0.5 inline-block rounded-full ${
                          risk.risk_level === 'HIGH' ? 'bg-red-100 text-red-700' :
                          risk.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {risk.risk_level} RISK
                        </div>
                      </div>

                      {/* Risk Factors Chart */}
                      <div className="glass-card-static p-5 lg:col-span-2">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-rail-blue" />
                          Risk Factors Breakdown
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={riskFactors} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} stroke="#94a3b8" />
                            <Tooltip
                              contentStyle={{
                                background: 'rgba(255,255,255,0.95)',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                            />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                              {riskFactors.map((entry, idx) => (
                                <Cell
                                  key={idx}
                                  fill={entry.score >= 70 ? '#DC2626' : entry.score >= 40 ? '#F59E0B' : '#16A34A'}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Confidence & Meta */}
                    <div className="glass-card-static p-5">
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-rail-steel" />
                          <span className="text-xs text-slate-500">Confidence:</span>
                          <span className="text-sm font-semibold text-slate-700">
                            {(risk.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-rail-steel" />
                          <span className="text-xs text-slate-500">Health Score:</span>
                          <span className="text-sm font-semibold text-slate-700">{risk.health_score}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-rail-steel" />
                          <span className="text-xs text-slate-500">Model:</span>
                          <span className="text-xs font-mono text-slate-600">{risk.model_version}</span>
                        </div>
                        <div className="ml-auto px-3 py-1 bg-purple-50 rounded-lg border border-purple-100">
                          <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">
                            Decision Support / Prototype Prediction
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recommended Actions */}
                    {risk.recommended_actions.length > 0 && (
                      <div className="glass-card-static p-5">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Recommended Actions
                        </h3>
                        <div className="space-y-2">
                          {risk.recommended_actions.map((action, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-3 rounded-lg bg-amber-50/50 border border-amber-100"
                            >
                              <ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                              <span className="text-sm text-slate-700">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="glass-card-static p-12 text-center">
                    <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No risk analysis available for this fitting</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-700">{value}</span>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-slate-50/50">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

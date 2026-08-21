import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Activity,
  Target,
  Zap,
  BarChart3,
  Clock,
  Shield,
  Cpu,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import type { AIInsight, ForecastItem, RiskAnalysis, PaginatedResponse } from '@/types';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#f59e0b',
  LOW: '#3b82f6',
};

const INSIGHT_ICONS: Record<string, typeof Brain> = {
  WEAR_ANALYSIS: Activity,
  CORROSION_ALERT: AlertTriangle,
  FAILURE_PREDICTION: TrendingUp,
  MAINTENANCE_RECOMMENDATION: Target,
  RISK_ASSESSMENT: Shield,
  PATTERN_DETECTION: BarChart3,
};

function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-32 rounded-lg" />
      ))}
    </div>
  );
}

export default function AIAnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Analytics & Risk Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">Decision Support / Prototype Prediction Models</p>
      </div>

      <SectionForecast />
      <SectionFailurePatterns />
      <SectionInsights />
      <SectionRiskTool />
    </div>
  );
}

// ── Section A: Forecast Overview ──
function SectionForecast() {
  const [data7, setData7] = useState<ForecastItem[]>([]);
  const [data30, setData30] = useState<ForecastItem[]>([]);
  const [data90, setData90] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.ai.forecast({ days: 7 }),
      api.ai.forecast({ days: 30 }),
      api.ai.forecast({ days: 90 }),
    ])
      .then(([d7, d30, d90]) => {
        setData7(d7);
        setData30(d30);
        setData90(d90);
      })
      .catch(() => toast.error('Failed to load forecast data'))
      .finally(() => setLoading(false));
  }, []);

  const forecastCards = [
    { label: 'Next 7 Days', data: data7, icon: Clock, color: 'text-red-600 bg-red-50' },
    { label: 'Next 30 Days', data: data30, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
    { label: 'Next 90 Days', data: data90, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-rail-blue" />
        Risk Prediction Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecastCards.map((card) => {
          const priorityBreakdown = card.data.reduce(
            (acc, item) => {
              acc[item.priority] = (acc[item.priority] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );
          return (
            <div key={card.label} className="glass-card-static p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={clsx('p-2 rounded-lg', card.color)}>
                  <card.icon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{card.label}</h3>
                  <p className="text-xs text-slate-500">fittings needing maintenance</p>
                </div>
              </div>
              {loading ? (
                <div className="skeleton h-12 rounded-lg" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-slate-900 mb-3">{card.data.length}</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(priorityBreakdown).map(([p, count]) => (
                      <span
                        key={p}
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${PRIORITY_COLORS[p]}15`,
                          color: PRIORITY_COLORS[p],
                        }}
                      >
                        {p}: {count}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Section B: Failure Pattern Detection ──
function SectionFailurePatterns() {
  const [assetHealth, setAssetHealth] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.reports.assetHealth(), api.reports.maintenance()])
      .then(([ah, mt]) => {
        setAssetHealth(ah as any[]);
        setMaintenance(mt as any[]);
      })
      .catch(() => toast.error('Failed to load pattern data'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <BarChart3 size={18} className="text-rail-blue" />
        Failure Pattern Detection
      </h2>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card-static p-5"><div className="skeleton h-64 rounded-lg" /></div>
          <div className="glass-card-static p-5"><div className="skeleton h-64 rounded-lg" /></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Defects by Zone (using Asset Health data) */}
          <div className="glass-card-static p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Health Distribution by Zone</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={assetHealth.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="zone_name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="critical_pct" name="Critical %" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attention_pct" name="Attention %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="healthy_pct" name="Healthy %" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Maintenance by Zone */}
          <div className="glass-card-static p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Maintenance Load by Zone</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={maintenance.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="zone_name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="overdue" name="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="in_progress" name="In Progress" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section C: AI Insights Stream ──
function SectionInsights() {
  const [data, setData] = useState<PaginatedResponse<AIInsight> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.ai.insights({ page, page_size: 10 });
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const totalPages = data?.total_pages || 1;

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Brain size={18} className="text-rail-blue" />
        AI Insights Stream
      </h2>

      {loading ? (
        <LoadingSkeleton />
      ) : !data || data.items.length === 0 ? (
        <div className="glass-card-static p-8 text-center text-slate-400">
          <Brain size={40} strokeWidth={1} className="mx-auto mb-3" />
          <p>No insights available yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((insight) => {
            const IconComp = INSIGHT_ICONS[insight.insight_type] || Zap;
            let factors: Record<string, number> | null = null;
            if (insight.factors) {
              try {
                factors = JSON.parse(insight.factors);
              } catch {
                // not valid JSON
              }
            }

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card-static p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rail-blue/10 text-rail-blue flex-shrink-0 mt-0.5">
                    <IconComp size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-slate-900">{insight.title}</h3>
                      <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">
                        {insight.insight_type}
                      </span>
                    </div>
                    {insight.description && (
                      <p className="text-xs text-slate-600 mb-2">{insight.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      {insight.risk_score != null && (
                        <span className={clsx(
                          'text-xs font-semibold px-2 py-0.5 rounded-full',
                          insight.risk_score >= 70 ? 'bg-red-100 text-red-700' :
                          insight.risk_score >= 40 ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        )}>
                          Risk: {insight.risk_score}
                        </span>
                      )}
                      {insight.confidence != null && (
                        <span className="text-xs text-slate-500">
                          Confidence: {(insight.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      {insight.fitting_id && (
                        <span className="text-xs text-slate-400">Fitting #{insight.fitting_id}</span>
                      )}
                    </div>
                    {factors && Object.keys(factors).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {Object.entries(factors).map(([key, val]) => (
                          <span key={key} className="text-xs px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-600">
                            {key}: {typeof val === 'number' ? val.toFixed(1) : val}
                          </span>
                        ))}
                      </div>
                    )}
                    {insight.recommended_action && (
                      <p className="text-xs text-rail-blue font-medium">
                        Recommended: {insight.recommended_action}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(insight.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-500">
            Page {data.page} of {data.total_pages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-40 text-slate-500"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-40 text-slate-500"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section D: Risk Analysis Tool ──
function SectionRiskTool() {
  const [fittingId, setFittingId] = useState('');
  const [result, setResult] = useState<RiskAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!fittingId) {
      toast.error('Enter a fitting ID');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.ai.risk(Number(fittingId));
      setResult(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to analyze risk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Cpu size={18} className="text-rail-blue" />
        Risk Analysis Tool
      </h2>

      <div className="glass-card-static p-5">
        <div className="flex gap-3 mb-6">
          <input
            type="number"
            value={fittingId}
            onChange={(e) => setFittingId(e.target.value)}
            placeholder="Enter Fitting ID"
            className="flex-1 max-w-xs px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rail-blue/30 focus:border-rail-blue"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={analyze}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-rail-blue text-white rounded-lg text-sm font-medium hover:bg-gov-blue transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Analyze Risk
          </motion.button>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Top row: Score gauge + Risk level */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Risk Score Gauge */}
              <div className="glass p-4 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-2">Risk Score</p>
                <div className="relative w-28 h-28 mx-auto">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={result.risk_score >= 70 ? '#ef4444' : result.risk_score >= 40 ? '#f59e0b' : '#16a34a'}
                      strokeWidth="8"
                      strokeDasharray={`${(result.risk_score / 100) * 264} 264`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900">{result.risk_score}</span>
                  </div>
                </div>
              </div>

              {/* Risk Level */}
              <div className="glass p-4 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-2">Risk Level</p>
                <span className={clsx(
                  'inline-block px-4 py-2 rounded-lg text-sm font-bold uppercase',
                  result.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                  result.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                  result.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                )}>
                  {result.risk_level}
                </span>
              </div>

              {/* Health + Confidence */}
              <div className="glass p-4 rounded-xl space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Health Score</p>
                  <p className="text-lg font-bold text-slate-900">{result.health_score}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Confidence</p>
                  <p className="text-lg font-bold text-slate-900">{(result.confidence * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Model</p>
                  <p className="text-xs font-mono text-slate-600">{result.model_version}</p>
                </div>
              </div>
            </div>

            {/* Factors */}
            {Object.keys(result.factors).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Contributing Factors</h3>
                <div className="space-y-2">
                  {Object.entries(result.factors)
                    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                    .map(([factor, points]) => (
                      <div key={factor} className="flex items-center gap-3">
                        <span className="text-xs text-slate-600 w-40 truncate">{factor}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              'h-full rounded-full',
                              points >= 70 ? 'bg-red-500' : points >= 40 ? 'bg-amber-500' : 'bg-green-500'
                            )}
                            style={{ width: `${Math.min(Math.abs(points), 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-700 w-12 text-right">
                          {typeof points === 'number' ? points.toFixed(1) : points}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {result.recommended_actions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Recommended Actions</h3>
                <ul className="space-y-2">
                  {result.recommended_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <Target size={14} className="text-rail-blue mt-0.5 flex-shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

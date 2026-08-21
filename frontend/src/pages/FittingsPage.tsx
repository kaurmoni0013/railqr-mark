import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  ArrowUpDown,
  Package,
  SlidersHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/services/api';
import type { TrackFitting, PaginatedResponse } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'HEALTHY', label: 'Healthy' },
  { value: 'ATTENTION', label: 'Attention' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'RETIRED', label: 'Retired' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'fishplate', label: 'Fishplate' },
  { value: 'bolt', label: 'Bolt' },
  { value: 'pad', label: 'Pad' },
  { value: 'sleeper', label: 'Sleeper' },
  { value: 'rail', label: 'Rail' },
  { value: 'spring', label: 'Spring' },
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

const healthColor = (score: number) => {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
};

const healthBg = (score: number) => {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="py-3 px-3"><div className="skeleton h-4 w-full" /></td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card-static p-4 space-y-3">
      <div className="skeleton h-5 w-24" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-2/3" />
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-12 rounded-full" />
      </div>
    </div>
  );
}

export default function FittingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState<PaginatedResponse<TrackFitting> | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(
    (searchParams.get('view') as 'table' | 'grid') || 'table'
  );

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [zone, setZone] = useState(searchParams.get('zone') || '');
  const [division, setDivision] = useState(searchParams.get('division') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const pageSize = 12;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, page_size: pageSize };
      if (search) params.search = search;
      if (status) params.status = status;
      if (type) params.type = type;
      if (zone) params.zone = zone;
      if (division) params.division = division;
      const result = await api.fittings.list(params);
      setData(result);
    } catch (err) {
      console.error('Failed to load fittings', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, type, zone, division]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    if (viewMode !== 'table') params.set('view', viewMode);
    if (page > 1) params.set('page', String(page));
    setSearchParams(params, { replace: true });
  }, [search, status, type, viewMode, page, setSearchParams]);

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Track Assets</h1>
          {data && (
            <span className="px-2.5 py-0.5 bg-rail-blue/10 text-rail-blue text-xs font-semibold rounded-full">
              {data.total} fittings
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-rail-blue text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-rail-blue text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card-static p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-rail-steel" />
          <span className="text-xs font-medium text-rail-steel uppercase tracking-wider">Filters</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search fittings..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-rail-blue/50 focus:ring-1 focus:ring-rail-blue/20 transition-all bg-white"
            />
          </div>
          <select
            value={zone}
            onChange={(e) => { setZone(e.target.value); handleFilterChange(); }}
            className="py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-rail-blue/50 bg-white text-slate-700"
          >
            <option value="">All Zones</option>
          </select>
          <select
            value={division}
            onChange={(e) => { setDivision(e.target.value); handleFilterChange(); }}
            className="py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-rail-blue/50 bg-white text-slate-700"
          >
            <option value="">All Divisions</option>
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); handleFilterChange(); }}
            className="py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-rail-blue/50 bg-white text-slate-700"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); handleFilterChange(); }}
            className="py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-rail-blue/50 bg-white text-slate-700"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card-static overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1"><Package className="w-3 h-3" /> Fitting Code</div>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Zone</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1"><ArrowUpDown className="w-3 h-3" /> Health</div>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</div>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Last Inspection</div>
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                  {!loading && data?.items.map((fitting) => (
                    <tr
                      key={fitting.id}
                      className="border-b border-slate-50 hover:bg-slate-50/70 cursor-pointer transition-colors"
                      onClick={() => navigate(`/fittings/${fitting.id}`)}
                    >
                      <td className="py-3 px-3 font-mono text-xs font-semibold text-rail-blue">{fitting.fitting_code}</td>
                      <td className="py-3 px-3 text-xs text-slate-600">Type-{fitting.fitting_type_id}</td>
                      <td className="py-3 px-3 text-xs text-slate-600">Zone-{fitting.zone_id}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor(fitting.status)}`}>
                          {fitting.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${healthBg(fitting.health_score)}`}
                              style={{ width: `${fitting.health_score}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${healthColor(fitting.health_score)}`}>
                            {fitting.health_score}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 max-w-[120px] truncate">{fitting.location_name || '—'}</td>
                      <td className="py-3 px-3 text-xs text-slate-500">
                        {fitting.last_inspection_date ? format(new Date(fitting.last_inspection_date), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/fittings/${fitting.id}`); }}
                          className="text-xs font-medium text-rail-blue hover:text-rail-blue/70 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && data?.items.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No track fittings found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              {!loading && data?.items.map((fitting) => (
                <motion.div
                  key={fitting.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-4 cursor-pointer"
                  onClick={() => navigate(`/fittings/${fitting.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-xs font-semibold text-rail-blue">{fitting.fitting_code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor(fitting.status)}`}>
                      {fitting.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="text-xs text-slate-600">Type-{fitting.fitting_type_id}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {fitting.location_name || 'No location'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase">Health</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${healthBg(fitting.health_score)}`}
                        style={{ width: `${fitting.health_score}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${healthColor(fitting.health_score)}`}>
                      {fitting.health_score}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {fitting.last_inspection_date
                      ? format(new Date(fitting.last_inspection_date), 'dd MMM yyyy')
                      : 'No inspection yet'
                    }
                  </div>
                </motion.div>
              ))}
              {!loading && data?.items.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No track fittings found</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between glass-card-static px-4 py-3"
        >
          <span className="text-xs text-slate-500">
            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, data.total)} of {data.total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, data.total_pages) }, (_, i) => {
              let pageNum: number;
              if (data.total_pages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= data.total_pages - 2) {
                pageNum = data.total_pages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    page === pageNum
                      ? 'bg-rail-blue text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              disabled={page >= data.total_pages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

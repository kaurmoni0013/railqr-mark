import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HeartPulse,
  Wrench,
  ClipboardCheck,
  Building2,
  MapPin,
  Download,
  Eye,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import type { AssetHealthReport, MaintenanceReport } from '@/types';

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: typeof HeartPulse;
  color: string;
  columns: string[];
}

const REPORT_TYPES: ReportType[] = [
  {
    id: 'asset-health',
    title: 'Asset Health Report',
    description: 'Health distribution and scoring across railway zones',
    icon: HeartPulse,
    color: 'text-green-600 bg-green-50',
    columns: ['Zone', 'Total Fittings', 'Avg Health', 'Healthy %', 'Attention %', 'Critical %'],
  },
  {
    id: 'maintenance',
    title: 'Maintenance Report',
    description: 'Maintenance ticket statistics and cost analysis',
    icon: Wrench,
    color: 'text-blue-600 bg-blue-50',
    columns: ['Zone', 'Total Tickets', 'Completed', 'In Progress', 'Overdue', 'Total Cost'],
  },
  {
    id: 'inspection-compliance',
    title: 'Inspection Compliance Report',
    description: 'Inspection completion rates and compliance metrics',
    icon: ClipboardCheck,
    color: 'text-amber-600 bg-amber-50',
    columns: ['Zone', 'Total', 'Completed', 'Compliance Rate', 'Overdue'],
  },
  {
    id: 'vendor-quality',
    title: 'Vendor Quality Report',
    description: 'Vendor performance and quality ratings',
    icon: Building2,
    color: 'text-purple-600 bg-purple-50',
    columns: ['Vendor', 'Total Fittings', 'Avg Health', 'Rating', 'Defect Rate'],
  },
  {
    id: 'zone-performance',
    title: 'Zone Performance Report',
    description: 'Comprehensive zone-level performance metrics',
    icon: MapPin,
    color: 'text-red-600 bg-red-50',
    columns: ['Zone', 'Total', 'Avg Health', 'Compliance', 'Efficiency', 'Critical Alerts'],
  },
];

function LoadingSkeleton() {
  return (
    <div className="glass-card-static p-5 space-y-4">
      <div className="skeleton h-6 w-48 rounded" />
      <div className="skeleton h-64 rounded-lg" />
    </div>
  );
}

export default function ReportsPage() {
  const [selected, setSelected] = useState<ReportType | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadReport = async (report: ReportType) => {
    setSelected(report);
    setLoading(true);
    setReportData([]);
    try {
      let data: any;
      switch (report.id) {
        case 'asset-health':
          data = await api.reports.assetHealth();
          break;
        case 'maintenance':
          data = await api.reports.maintenance();
          break;
        case 'inspection-compliance':
          data = await api.reports.inspectionCompliance();
          break;
        case 'vendor-quality':
          data = await api.reports.vendorQuality();
          break;
        case 'zone-performance':
          data = await api.reports.zonePerformance();
          break;
        default:
          data = [];
      }
      setReportData(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    setExporting(true);
    try {
      await api.reports.export(type);
      toast.success('Report exported successfully');
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Generate and export railway asset reports</p>
        </div>
        {selected && (
          <button
            onClick={() => { setSelected(null); setReportData([]); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Reports
          </button>
        )}
      </div>

      {!selected ? (
        /* Report Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TYPES.map((report) => {
            const IconComp = report.icon;
            return (
              <motion.div
                key={report.id}
                whileHover={{ scale: 1.01 }}
                className="glass-card p-5 cursor-pointer"
                onClick={() => loadReport(report)}
              >
                <div className={clsx('inline-flex p-2.5 rounded-lg mb-3', report.color)}>
                  <IconComp size={20} />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{report.title}</h3>
                <p className="text-xs text-slate-500 mb-4">{report.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); loadReport(report); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-rail-blue text-white rounded-lg hover:bg-gov-blue transition-colors"
                  >
                    <Eye size={12} />
                    View Report
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleExport(report.id); }}
                    disabled={exporting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    Export CSV
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Report Detail View */
        <div className="space-y-4">
          <div className="glass-card-static p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={clsx('p-2 rounded-lg', selected.color)}>
                  <selected.icon size={18} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{selected.title}</h2>
                  <p className="text-xs text-slate-500">{reportData.length} records</p>
                </div>
              </div>
              <button
                onClick={() => handleExport(selected.id)}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                Export CSV
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : reportData.length === 0 ? (
            <div className="glass-card-static p-8 text-center text-slate-400">
              <p>No data available for this report</p>
            </div>
          ) : (
            <>
              {/* Chart */}
              <div className="glass-card-static p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">{selected.title} - Visualization</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey={getDataKey(selected.id, 'x')}
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    {getBarKeys(selected.id).map((key, i) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        name={key.replace(/_/g, ' ')}
                        fill={BAR_COLORS[i % BAR_COLORS.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Data Table */}
              <div className="glass-card-static overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200/60">
                        {selected.columns.map((col) => (
                          <th key={col} className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, i) => (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          {getTableValues(selected.id, row).map((val, j) => (
                            <td key={j} className="px-4 py-3 text-slate-700 text-xs">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const BAR_COLORS = ['#0B5CAB', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#06B6D4'];

function getDataKey(reportId: string, axis: 'x' | 'bars'): string {
  if (axis === 'x') {
    switch (reportId) {
      case 'asset-health':
      case 'maintenance':
      case 'inspection-compliance':
      case 'zone-performance':
        return 'zone_name';
      case 'vendor-quality':
        return 'name';
      default:
        return 'name';
    }
  }
  return 'zone_name';
}

function getBarKeys(reportId: string): string[] {
  switch (reportId) {
    case 'asset-health':
      return ['healthy_pct', 'attention_pct', 'critical_pct'];
    case 'maintenance':
      return ['completed', 'in_progress', 'overdue'];
    case 'inspection-compliance':
      return ['completed_count', 'overdue_count'];
    case 'vendor-quality':
      return ['avg_health_score', 'rating'];
    case 'zone-performance':
      return ['avg_health_score', 'efficiency_score'];
    default:
      return [];
  }
}

function getTableValues(reportId: string, row: any): string[] {
  switch (reportId) {
    case 'asset-health':
      return [
        row.zone_name || '--',
        String(row.total_fittings ?? '--'),
        `${(row.avg_health_score ?? 0).toFixed(1)}`,
        `${(row.healthy_pct ?? 0).toFixed(1)}%`,
        `${(row.attention_pct ?? 0).toFixed(1)}%`,
        `${(row.critical_pct ?? 0).toFixed(1)}%`,
      ];
    case 'maintenance':
      return [
        row.zone_name || '--',
        String(row.total_tickets ?? '--'),
        String(row.completed ?? '--'),
        String(row.in_progress ?? '--'),
        String(row.overdue ?? '--'),
        `$${(row.total_cost ?? 0).toLocaleString()}`,
      ];
    case 'inspection-compliance':
      return [
        row.zone_name || '--',
        String(row.total ?? row.total_inspections ?? '--'),
        String(row.completed_count ?? row.completed ?? '--'),
        `${(row.compliance_rate ?? 0).toFixed(1)}%`,
        String(row.overdue_count ?? row.overdue ?? '--'),
      ];
    case 'vendor-quality':
      return [
        row.name || row.vendor_name || '--',
        String(row.total_fittings ?? '--'),
        `${(row.avg_health_score ?? 0).toFixed(1)}`,
        `${(row.rating ?? 0).toFixed(1)}`,
        `${(row.defect_rate ?? 0).toFixed(1)}%`,
      ];
    case 'zone-performance':
      return [
        row.zone_name || '--',
        String(row.total_fittings ?? row.total ?? '--'),
        `${(row.avg_health_score ?? 0).toFixed(1)}`,
        `${(row.compliance_rate ?? row.compliance ?? 0).toFixed(1)}%`,
        `${(row.efficiency_score ?? row.efficiency ?? 0).toFixed(1)}%`,
        String(row.critical_alerts ?? '--'),
      ];
    default:
      return Object.values(row).map(String);
  }
}

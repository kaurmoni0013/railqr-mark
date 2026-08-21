import { usePagination } from '@/hooks/useApi';
import { api } from '@/services/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function InspectionsPage() {
  const {
    data,
    page,
    setPage,
    total,
    totalPages,
    loading,
    error,
  } = usePagination((p) => api.inspections.list(p));

  return (
    <div className="space-y-4">
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : data.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No inspections"
          description="No inspection records found."
        />
      ) : (
        <>
          <div className="glass-card-static overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Fitting ID</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Health Score</th>
                  <th className="px-4 py-3 font-medium">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {data.map((ins) => (
                  <tr key={ins.id} className="border-b border-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">
                      {ins.inspection_code}
                    </td>
                    <td className="px-4 py-3 text-gray-600">#{ins.fitting_id}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ins.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {ins.health_score ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {ins.scheduled_date
                        ? format(new Date(ins.scheduled_date), 'dd MMM yyyy')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-3 py-1">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

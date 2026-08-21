import { usePagination } from '@/hooks/useApi';
import { api } from '@/services/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
  const {
    data,
    page,
    setPage,
    total,
    totalPages,
    loading,
    error,
  } = usePagination((p) => api.maintenance.list(p));

  return (
    <div className="space-y-4">
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : data.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance tickets"
          description="No maintenance records found."
        />
      ) : (
        <>
          <div className="glass-card-static overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">Ticket</th>
                  <th className="px-4 py-3 font-medium">Fitting ID</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">
                      {t.ticket_code}
                    </td>
                    <td className="px-4 py-3 text-gray-600">#{t.fitting_id}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.priority} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} size="sm" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {t.due_date
                        ? new Date(t.due_date).toLocaleDateString('en-IN')
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

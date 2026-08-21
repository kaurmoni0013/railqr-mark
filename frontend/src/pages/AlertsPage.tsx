import { usePagination } from '@/hooks/useApi';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import StatusBadge from '@/components/ui/StatusBadge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AlertsPage() {
  const { user } = useAuth();
  const {
    data,
    page,
    setPage,
    total,
    totalPages,
    loading,
    error,
    refetch,
  } = usePagination((p) => api.alerts.list(p));

  async function handleAcknowledge(id: number) {
    try {
      await api.alerts.acknowledge(id);
      toast.success('Alert acknowledged');
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleResolve(id: number) {
    try {
      await api.alerts.resolve(id, user?.email);
      toast.success('Alert resolved');
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : data.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No alerts"
          description="All clear — no active alerts."
        />
      ) : (
        <>
          <div className="glass-card-static overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">Alert</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{a.title}</p>
                      <p className="text-[10px] text-gray-400">{a.alert_code}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.severity} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {a.alert_type}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {format(new Date(a.created_at), 'dd MMM, HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {!a.is_acknowledged && (
                          <button
                            onClick={() => handleAcknowledge(a.id)}
                            className="rounded border border-gray-200 px-2 py-1 text-[10px] text-gray-600 hover:bg-gray-50"
                          >
                            Ack
                          </button>
                        )}
                        {!a.is_resolved && (
                          <button
                            onClick={() => handleResolve(a.id)}
                            className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700 hover:bg-emerald-100"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
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

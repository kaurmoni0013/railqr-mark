import { useState, useEffect } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: 'Admin', color: 'text-purple-700', bg: 'bg-purple-100' },
  RAILWAY_OFFICER: { label: 'Railway Officer', color: 'text-blue-700', bg: 'bg-blue-100' },
  INSPECTOR: { label: 'Inspector', color: 'text-green-700', bg: 'bg-green-100' },
  MAINTENANCE_ENGINEER: { label: 'Maintenance Engineer', color: 'text-amber-700', bg: 'bg-amber-100' },
  VIEWER: { label: 'Viewer', color: 'text-slate-700', bg: 'bg-slate-100' },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] || { label: role, color: 'text-gray-700', bg: 'bg-gray-100' };
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', cfg.bg, cfg.color)}>
      {cfg.label}
    </span>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('railqr_token')}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(Array.isArray(data) ? data : data.items || []);
        } else {
          toast.error('Failed to load users');
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage system users and roles</p>
      </div>

      {/* Table */}
      <div className="glass-card-static overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/60">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Zone</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 size={20} className="animate-spin text-rail-blue mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <Users size={40} strokeWidth={1} className="mx-auto mb-3" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className={clsx(
                      'border-b border-slate-100 transition-colors',
                      currentUser?.id === u.id && 'bg-rail-blue/5'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'font-medium text-slate-800',
                          currentUser?.id === u.id && 'text-rail-blue'
                        )}>
                          {u.full_name}
                        </span>
                        {currentUser?.id === u.id && (
                          <span className="text-xs text-rail-blue bg-rail-blue/10 px-1.5 py-0.5 rounded">You</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{u.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{u.zone_id ?? '--'}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'inline-flex items-center gap-1 text-xs font-medium',
                        u.is_active ? 'text-green-600' : 'text-slate-400'
                      )}>
                        <div className={clsx('w-1.5 h-1.5 rounded-full', u.is_active ? 'bg-green-500' : 'bg-slate-300')} />
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {format(new Date(u.created_at), 'dd MMM yyyy')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

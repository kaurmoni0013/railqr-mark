import { useState, useEffect } from 'react';
import { User, Settings, Info, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch('/api/dashboard/summary', {
          headers: { Authorization: `Bearer ${localStorage.getItem('railqr_token')}` },
        });
        setApiStatus(res.ok ? 'online' : 'offline');
      } catch {
        setApiStatus('offline');
      }
    };
    checkApi();
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Application settings and information</p>
      </div>

      {/* Profile Section */}
      <div className="glass-card-static p-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-rail-blue" />
          <h2 className="text-base font-semibold text-slate-800">Profile</h2>
        </div>
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Name</span>
              <span className="text-sm font-medium text-slate-800">{user.full_name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-sm font-medium text-slate-800">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Role</span>
              <span className="text-sm font-medium text-slate-800">{user.role.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Zone</span>
              <span className="text-sm font-medium text-slate-800">{user.zone_id ?? 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Member Since</span>
              <span className="text-sm font-medium text-slate-800">
                {format(new Date(user.created_at), 'dd MMMM yyyy')}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Loading user info...</p>
        )}
      </div>

      {/* System Section */}
      <div className="glass-card-static p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-rail-blue" />
          <h2 className="text-base font-semibold text-slate-800">System</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Application</span>
            <span className="text-sm font-medium text-slate-800">RailQR Mark</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Version</span>
            <span className="text-sm font-medium text-slate-800">1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-500">API Status</span>
            <span className="flex items-center gap-1.5">
              {apiStatus === 'checking' ? (
                <Loader2 size={14} className="animate-spin text-slate-400" />
              ) : apiStatus === 'online' ? (
                <CheckCircle2 size={14} className="text-green-500" />
              ) : (
                <XCircle size={14} className="text-red-500" />
              )}
              <span className={`text-sm font-medium ${apiStatus === 'online' ? 'text-green-600' : apiStatus === 'offline' ? 'text-red-600' : 'text-slate-400'}`}>
                {apiStatus === 'checking' ? 'Checking...' : apiStatus === 'online' ? 'Connected' : 'Offline'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="glass-card-static p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={18} className="text-rail-blue" />
          <h2 className="text-base font-semibold text-slate-800">About</h2>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            RailQR Mark is an innovation prototype created for railway asset traceability and maintenance intelligence demonstration.
            It provides QR-based fitting identification, AI-powered risk prediction, inspection management, and maintenance workflow
            tools designed for Indian Railways infrastructure management.
          </p>
          <div className="glass p-4 rounded-lg border-l-4 border-amber-400 bg-amber-50/50">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Disclaimer:</strong> RailQR Mark is an innovation prototype created for railway asset traceability and maintenance intelligence demonstration.
              Synthetic data is used for fitting-level records and prototype analytics unless explicitly identified as sourced aggregate public data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

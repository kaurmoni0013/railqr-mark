import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import { type ReactNode } from 'react';

import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ScanPage from '@/pages/ScanPage';
import QRGeneratePage from '@/pages/QRGeneratePage';
import FittingsPage from '@/pages/FittingsPage';
import FittingDetailPage from '@/pages/FittingDetailPage';
import InspectionsPage from '@/pages/InspectionsPage';
import MaintenancePage from '@/pages/MaintenancePage';
import MapPage from '@/pages/MapPage';
import AIAnalyticsPage from '@/pages/AIAnalyticsPage';
import AlertsPage from '@/pages/AlertsPage';
import ReportsPage from '@/pages/ReportsPage';
import UsersPage from '@/pages/UsersPage';
import SettingsPage from '@/pages/SettingsPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-rail-ice">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-rail-blue border-t-transparent" />
          <span className="text-sm text-rail-steel">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="scan" element={<ScanPage />} />
        <Route path="qr-generate" element={<QRGeneratePage />} />
        <Route path="fittings" element={<FittingsPage />} />
        <Route path="fittings/:id" element={<FittingDetailPage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="ai" element={<AIAnalyticsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        {user?.role === 'ADMIN' && (
          <Route path="users" element={<UsersPage />} />
        )}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'toast-custom',
          style: {
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#16A34A', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#DC2626', secondary: '#fff' },
          },
        }}
      />
    </>
  );
}

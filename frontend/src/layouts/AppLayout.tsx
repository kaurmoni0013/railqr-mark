import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import clsx from 'clsx';
import {
  LayoutDashboard,
  ScanLine,
  QrCode,
  Package,
  ClipboardCheck,
  Wrench,
  Map,
  Brain,
  Bell,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scan', label: 'Scan QR', icon: ScanLine },
  { to: '/qr-generate', label: 'QR Generate', icon: QrCode },
  { to: '/fittings', label: 'Track Assets', icon: Package },
  { to: '/inspections', label: 'Inspections', icon: ClipboardCheck },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/ai', label: 'AI Analytics', icon: Brain },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/users', label: 'Users', icon: Users, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function getActiveNavTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/fittings/')) return 'Asset Detail';
  const found = navItems.find(
    (n) => n.to !== '/' && pathname === n.to,
  );
  return found?.label ?? 'Dashboard';
}

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api.dashboard
      .summary()
      .then((s) => setAlertCount(s.active_alerts))
      .catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const pageTitle = getActiveNavTitle(location.pathname);
  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const filteredNav = navItems.filter(
    (n) => !n.adminOnly || hasRole('ADMIN'),
  );

  function NavLinks() {
    return (
      <>
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isExact = item.to === '/';
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={isExact}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-rail-blue/20 text-white'
                    : 'text-navy-200/60 hover:bg-white/5 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={clsx(
                      'shrink-0 transition-colors',
                      isActive
                        ? 'text-rail-blue'
                        : 'text-navy-200/40 group-hover:text-navy-200/70',
                    )}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <ChevronRight
                      size={14}
                      className="ml-auto text-rail-blue/60"
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-rail-ice">
      {/* Government bar */}
      <div className="flex items-center justify-between bg-navy px-4 py-1.5 text-[11px] text-white/70">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-white/90">Government of India</span>
          <span className="text-white/30">|</span>
          <span>Ministry of Railways</span>
          <span className="text-white/30">|</span>
          <span className="text-rail-blue font-medium">
            Railway Asset Intelligence System
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span>System Status: Operational</span>
          <span className="text-white/30">|</span>
          <span className="font-mono text-[10px] text-white/80">
            {format(currentTime, 'dd MMM yyyy, HH:mm:ss')}
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden w-[260px] shrink-0 flex-col bg-navy lg:flex">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-white/5 px-5 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rail-blue">
              <QrCode size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide text-white">
                RailSaathi
              </h1>
              <p className="text-[10px] text-navy-200/50">
                Asset Intelligence
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
            <NavLinks />
          </nav>

          {/* User */}
          <div className="border-t border-white/5 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rail-blue/30 text-xs font-semibold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white">
                  {user?.full_name ?? 'User'}
                </p>
                <p className="truncate text-[10px] text-navy-200/50">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="rounded-md p-1.5 text-navy-200/40 transition-colors hover:bg-white/5 hover:text-white"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-navy lg:hidden"
              >
                <div className="flex items-center justify-between border-b border-white/5 px-5 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rail-blue">
                      <QrCode size={20} className="text-white" />
                    </div>
                    <h1 className="text-sm font-bold text-white">
                      RailSaathi
                    </h1>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-md p-1 text-navy-200/50 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
                  <NavLinks />
                </nav>

                <div className="border-t border-white/5 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rail-blue/30 text-xs font-semibold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white">
                        {user?.full_name ?? 'User'}
                      </p>
                      <p className="truncate text-[10px] text-navy-200/50">
                        {user?.role?.replace('_', ' ')}
                      </p>
                    </div>
                    <button
                      onClick={logout}
                      className="rounded-md p-1.5 text-navy-200/40 hover:text-white"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="glass flex items-center justify-between border-b border-white/20 px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-rail-steel transition-colors hover:bg-black/5 lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-base font-semibold text-navy lg:text-lg">
                  {pageTitle}
                </h2>
                <p className="text-[11px] text-rail-steel">
                  {format(currentTime, 'EEEE, dd MMMM yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-white/60 px-3 py-1.5 text-sm text-rail-steel md:flex">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search assets..."
                  className="w-40 bg-transparent outline-none placeholder:text-rail-steel/50"
                />
              </div>

              {/* Notifications */}
              <button
                onClick={() => navigate('/alerts')}
                className="relative rounded-lg p-2 text-rail-steel transition-colors hover:bg-black/5"
              >
                <Bell size={19} />
                {alertCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {alertCount > 99 ? '99+' : alertCount}
                  </span>
                )}
              </button>

              {/* Avatar */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rail-blue text-xs font-semibold text-white">
                {initials}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="border-t border-gray-200 bg-white/40 px-6 py-2.5 text-center text-[10px] text-rail-steel/60">
            Prototype developed for innovation and demonstration purposes. Not an
            official Indian Railways production system.
          </footer>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { NavLink, Link, Outlet, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Utensils,
  FolderKanban,
  Home,
  Info,
  Megaphone,
  MapPin,
  Phone,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import KamaligLogo from '../../components/common/KamaligLogo';
import PwaInstallButton from '../../components/common/PwaInstallButton';

const ADMIN_NAV = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Menu Products', path: '/admin/products', icon: Utensils },
  { label: 'Categories', path: '/admin/categories', icon: FolderKanban },
  { label: 'Home Page Editor', path: '/admin/homepage', icon: Home },
  { label: 'About Us Editor', path: '/admin/about', icon: Info },
  { label: 'Promotional Banners', path: '/admin/promotions', icon: Megaphone },
  { label: 'Location & Map', path: '/admin/location', icon: MapPin },
  { label: 'Contact Info', path: '/admin/contact', icon: Phone },
  { label: 'Website Settings', path: '/admin/settings', icon: Settings },
  { label: 'Account & Password', path: '/admin/account', icon: ShieldCheck },
];

const MOBILE_BOTTOM_TABS = [
  { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Menu', path: '/admin/products', icon: Utensils },
  { label: 'Home', path: '/admin/homepage', icon: Home },
  { label: 'Map', path: '/admin/location', icon: MapPin },
];

export default function AdminLayout() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101C28] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#F6C928] border-t-transparent animate-spin" />
          <p className="text-sm text-[#FFF1C6]">Verifying Owner Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#101C28] text-white flex flex-col lg:flex-row">
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-[#171B20] border-b border-white/10 px-3.5 py-2.5 flex items-center justify-between sticky top-0 z-40">
        <KamaligLogo size="sm" />
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="px-2.5 py-1.5 rounded-xl bg-[#101C28] border border-white/15 text-[11px] font-bold text-[#FFF1C6] inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3 text-[#F6C928]" />
            <span>Live Site</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Open All Owner CMS Sections"
            className="p-2 rounded-xl bg-[#101C28] border border-[#F6C928]/40 text-[#F6C928]"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar / Mobile Slide-Over Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#171B20] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 space-y-5 overflow-y-auto">
          <div className="flex items-center justify-between">
            <KamaligLogo size="sm" />
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg bg-[#101C28] text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#101C28] border border-[#F6C928]/25 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F6C928] text-[#101C28] flex items-center justify-center font-display font-black text-sm flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">
                {user?.username || 'Owner'}
              </p>
              <p className="text-[11px] text-[#F6C928] font-semibold">
                {user?.role === 'OWNER' ? 'Owner • Full Access' : 'Administrator'}
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">
              Owner CMS Navigation
            </p>
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#F6C928] text-[#101C28] font-bold shadow-md'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <PwaInstallButton className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#23C7DF] text-[#101C28] cursor-pointer" />
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#101C28] hover:bg-white/10 text-[#FFF1C6] border border-white/15 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-[#F6C928]" />
            <span>View Public Website</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area (Extra bottom padding on mobile for bottom tab bar) */}
      <div className="flex-1 min-w-0 p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </div>

      {/* Mobile Thumb-Friendly Bottom Tab Bar */}
      <nav
        aria-label="Mobile Owner CMS Quick Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#171B20]/95 backdrop-blur-md border-t border-[#F6C928]/30 px-2 py-1.5 grid grid-cols-5 gap-1 shadow-2xl"
      >
        {MOBILE_BOTTOM_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-bold transition-colors ${
                  isActive
                    ? 'bg-[#F6C928] text-[#101C28]'
                    : 'text-gray-300 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate">{tab.label}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-bold text-[#F6C928] hover:bg-white/5"
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}

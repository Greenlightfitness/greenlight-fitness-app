import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { LayoutDashboard, Dumbbell, Calendar, CalendarClock, LogOut, Globe, ShoppingBag, Package, Home, Users, User, MessageCircle, MoreHorizontal, ChevronRight, ArrowLeft } from 'lucide-react';
import { signOut } from '../services/supabase';
import NotificationBell from './NotificationBell';

const Layout: React.FC = () => {
  const { userProfile, activeRole } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMorePage, setShowMorePage] = useState(false);

  const handleLogout = async () => {
    try { await signOut(); navigate('/login'); } catch (e) { console.error("Logout failed", e); }
  };

  const toggleLanguage = () => setLanguage(language === 'en' ? 'de' : 'en');

  const effectiveRole = activeRole || userProfile?.role;
  const isAthlete = effectiveRole === UserRole.ATHLETE;
  const isCoach = effectiveRole === UserRole.COACH;
  const isAdmin = effectiveRole === UserRole.ADMIN;

  // ======================== ROLE-BASED NAV ITEMS ========================

  const handleAthleteNav = (view: 'hub' | 'training') => {
    navigate('/', { state: { view } });
  };

  const currentView = location.state?.view || 'hub';
  const isDashboardRoute = location.pathname === '/';

  // --- Sidebar Nav (Desktop) — all items per role ---
  const sidebarNav = isAthlete ? [
    { label: 'Home', path: '/', icon: <Home size={20} />, onClick: () => handleAthleteNav('hub') },
    { label: 'Training', path: '/__training__', icon: <Calendar size={20} />, onClick: () => handleAthleteNav('training') },
    { label: 'Shop', path: '/shop', icon: <ShoppingBag size={20} /> },
    { label: 'Chat', path: '/chat', icon: <MessageCircle size={20} /> },
    { label: 'Profil', path: '/profile', icon: <User size={20} /> },
  ] : [
    { label: t('nav.dashboard'), path: '/', icon: <LayoutDashboard size={20} /> },
    { label: t('nav.exercises'), path: '/exercises', icon: <Dumbbell size={20} /> },
    { label: t('nav.planner'), path: '/planner', icon: <Calendar size={20} /> },
    { label: t('nav.products'), path: '/admin/products', icon: <Package size={20} /> },
    { label: 'Kalender', path: '/calendar', icon: <CalendarClock size={20} /> },
    { label: 'Chat', path: '/coach/chat', icon: <MessageCircle size={20} /> },
    { label: 'CRM', path: '/admin/crm', icon: <Users size={20} /> },
    { label: 'Profil', path: '/profile', icon: <User size={20} /> },
  ];

  // --- Mobile Bottom Nav (5 items max) ---
  const mobileNav = isAthlete ? [
    { label: 'Home', path: '/', icon: <Home size={24} />, onClick: () => handleAthleteNav('hub'), isActive: isDashboardRoute && currentView === 'hub' },
    { label: 'Training', path: '/__training__', icon: <Calendar size={24} />, onClick: () => handleAthleteNav('training'), isActive: isDashboardRoute && currentView === 'training' },
    { label: 'Shop', path: '/shop', icon: <ShoppingBag size={24} /> },
    { label: 'Chat', path: '/chat', icon: <MessageCircle size={24} /> },
    { label: 'Profil', path: '/profile', icon: <User size={24} /> },
  ] : [
    { label: 'Home', path: '/', icon: <LayoutDashboard size={24} /> },
    { label: 'Planner', path: '/planner', icon: <Calendar size={24} /> },
    { label: 'Chat', path: '/coach/chat', icon: <MessageCircle size={24} /> },
    { label: 'CRM', path: '/admin/crm', icon: <Users size={24} /> },
    { label: 'Mehr', path: '/__more__', icon: <MoreHorizontal size={24} />, isMore: true },
  ];

  // --- "Mehr" page items (Coach/Admin overflow) ---
  const morePageItems = [
    { label: t('nav.exercises'), path: '/exercises', icon: <Dumbbell size={20} />, color: 'bg-orange-500/15 text-orange-400' },
    { label: t('nav.products'), path: '/admin/products', icon: <Package size={20} />, color: 'bg-blue-500/15 text-blue-400' },
    { label: 'Kalender', path: '/calendar', icon: <CalendarClock size={20} />, color: 'bg-purple-500/15 text-purple-400' },
    { label: 'Profil', path: '/profile', icon: <User size={20} />, color: 'bg-green-500/15 text-green-400' },
  ];

  // Check if a "more" page item is currently active
  const isMoreItemActive = morePageItems.some(item => 
    location.pathname === item.path || location.pathname.startsWith(item.path)
  );

  const roleLabel = isAdmin ? 'Admin Panel' : isCoach ? 'Coach Dashboard' : 'Athlete';

  // Helper: check if a sidebar item is active
  const isSidebarActive = (item: typeof sidebarNav[0]) => {
    if (item.path === '/__training__') return isDashboardRoute && currentView === 'training';
    if (item.path === '/' && isAthlete) return isDashboardRoute && currentView === 'hub';
    return location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
  };

  // Helper: check if a mobile item is active
  const isMobileActive = (item: any) => {
    if (item.isMore) return showMorePage || isMoreItemActive;
    if ('isActive' in item && item.isActive !== undefined) return item.isActive;
    if (item.path === '/') return location.pathname === '/' && !showMorePage;
    return (location.pathname === item.path || location.pathname.startsWith(item.path)) && !showMorePage;
  };

  // Close "more" page when navigating to a non-more item via bottom nav
  const handleMobileNavClick = (item: any) => {
    if (item.isMore) {
      setShowMorePage(!showMorePage);
      return;
    }
    setShowMorePage(false);
    if (item.onClick) item.onClick();
  };

  // ======================== IMMERSIVE CHAT (Athlete) ========================
  const isImmersiveChat = isAthlete && location.pathname === '/chat';
  if (isImmersiveChat) {
    return (
      <div className="h-[100dvh] bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#00FF00] selection:text-black overflow-hidden">
        <Outlet />
      </div>
    );
  }

  // ======================== UNIFIED LAYOUT ========================
  return (
    <div className="min-h-screen flex bg-[#000000] text-white font-sans selection:bg-[#00FF00] selection:text-black overflow-x-hidden">

      {/* ============ DESKTOP SIDEBAR (All Roles, md+) ============ */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-[#000000] fixed h-full z-20">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-white tracking-tighter">
            GREENLIGHT<span className="text-[#00FF00]">.</span>
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium mt-2">
            {roleLabel}
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {sidebarNav.map((item) => {
            const active = isSidebarActive(item);
            if (item.onClick) {
              return (
                <button
                  key={item.path}
                  onClick={item.onClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left ${
                    active
                      ? 'bg-[#00FF00] text-black font-semibold shadow-[0_0_15px_rgba(0,255,0,0.3)]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={() =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-[#00FF00] text-black font-semibold shadow-[0_0_15px_rgba(0,255,0,0.3)]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-900 space-y-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-white transition-colors w-full text-sm"
          >
            <Globe size={18} />
            <span>{language === 'en' ? 'Deutsch' : 'English'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-red-400 transition-colors w-full text-sm"
          >
            <LogOut size={18} />
            <span>{t('nav.logout')}</span>
          </button>
          <div className="pt-2 text-[10px] text-zinc-600 flex gap-2 justify-center">
            <Link to="/legal/imprint" className="hover:text-zinc-400">Impressum</Link>
            <span>•</span>
            <Link to="/legal/privacy" className="hover:text-zinc-400">Datenschutz</Link>
          </div>
        </div>
      </aside>

      {/* ============ MOBILE TOP BAR (All Roles, <md) — Clean, no hamburger ============ */}
      <div className="md:hidden fixed top-0 w-full bg-[#000000]/95 backdrop-blur-md border-b border-zinc-800/50 z-30 safe-area-top">
        <div className="px-5 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold text-white tracking-tighter">
            GREENLIGHT<span className="text-[#00FF00]">.</span>
          </h1>
          <NotificationBell />
        </div>
      </div>

      {/* ============ MOBILE "MEHR" PAGE (Coach/Admin) ============ */}
      {showMorePage && !isAthlete && (
        <div className="md:hidden fixed inset-0 bg-[#000000] z-35 safe-area-top overflow-y-auto" style={{ zIndex: 35 }}>
          <div className="pt-20 px-5 pb-36">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setShowMorePage(false)}
                className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={22} />
              </button>
              <h1 className="text-2xl font-bold text-white tracking-tight">Mehr</h1>
            </div>

            {/* Navigation Items — Apple Settings Style */}
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 mb-2">Navigation</p>
                <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
                  {morePageItems.map((item) => {
                    const active = location.pathname === item.path || location.pathname.startsWith(item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setShowMorePage(false)}
                        className="flex items-center gap-3.5 p-4 hover:bg-zinc-900/50 transition-colors active:bg-zinc-800/50"
                      >
                        <div className={`w-9 h-9 rounded-[10px] ${item.color.split(' ')[0]} flex items-center justify-center shrink-0`}>
                          <div className={item.color.split(' ')[1]}>{item.icon}</div>
                        </div>
                        <span className={`flex-1 text-sm font-medium ${active ? 'text-[#00FF00]' : 'text-white'}`}>{item.label}</span>
                        <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                      </NavLink>
                    );
                  })}
                </div>
              </div>

              {/* Settings Section */}
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 mb-2">Einstellungen</p>
                <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
                  <button 
                    onClick={() => { toggleLanguage(); }}
                    className="flex items-center gap-3.5 p-4 hover:bg-zinc-900/50 transition-colors active:bg-zinc-800/50 w-full"
                  >
                    <div className="w-9 h-9 rounded-[10px] bg-zinc-700/50 flex items-center justify-center shrink-0">
                      <Globe size={18} className="text-zinc-300" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-white text-left">Sprache</span>
                    <span className="text-xs text-zinc-500 mr-1">{language === 'en' ? 'English' : 'Deutsch'}</span>
                    <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                  </button>
                </div>
              </div>

              {/* Account Section */}
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 mb-2">Account</p>
                <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3.5 p-4 hover:bg-red-500/5 transition-colors active:bg-red-500/10 w-full"
                  >
                    <div className="w-9 h-9 rounded-[10px] bg-red-500/15 flex items-center justify-center shrink-0">
                      <LogOut size={18} className="text-red-400" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-red-400 text-left">{t('nav.logout')}</span>
                  </button>
                </div>
              </div>

              {/* Legal */}
              <div className="text-[10px] text-zinc-600 flex gap-2 justify-center pt-2">
                <Link to="/legal/imprint" onClick={() => setShowMorePage(false)} className="hover:text-zinc-400">Impressum</Link>
                <span>•</span>
                <Link to="/legal/privacy" onClick={() => setShowMorePage(false)} className="hover:text-zinc-400">Datenschutz</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MOBILE BOTTOM NAV — Floating Glassmorphism (All Roles) ============ */}
      <div className="md:hidden fixed bottom-0 w-full z-40 px-4 pb-6 pt-2 pointer-events-none safe-area-bottom">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <div className="bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl flex justify-between items-center px-5 py-3.5">
            {mobileNav.map((item) => {
              const active = isMobileActive(item);
              const isMore = 'isMore' in item && item.isMore;
              
              if ('onClick' in item && item.onClick && !isMore) {
                return (
                  <button
                    key={item.path}
                    onClick={() => handleMobileNavClick(item)}
                    className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${active ? 'text-[#00FF00] scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {item.icon}
                  </button>
                );
              }
              
              if (isMore) {
                return (
                  <button
                    key={item.path}
                    onClick={() => handleMobileNavClick(item)}
                    className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${active ? 'text-[#00FF00] scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {item.icon}
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMorePage(false)}
                  className={() =>
                    `flex flex-col items-center gap-0.5 transition-all duration-300 ${active ? 'text-[#00FF00] scale-110' : 'text-zinc-500 hover:text-zinc-300'}`
                  }
                >
                  {item.icon}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============ DESKTOP TOP BAR (notification bell, top-right) ============ */}
      <div className="hidden md:flex fixed top-4 right-6 z-20">
        <NotificationBell />
      </div>

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1 md:ml-64 p-4 md:p-6 pt-20 md:pt-6 pb-28 md:pb-8 bg-[#000000] min-w-0 safe-area-top">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
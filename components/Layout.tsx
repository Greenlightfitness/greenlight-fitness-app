import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { LayoutDashboard, Dumbbell, Calendar, CalendarClock, LogOut, Menu, X, Globe, ShoppingBag, Package, Home, Users, User, MessageCircle, Scale, UserPlus, History } from 'lucide-react';
import { signOut } from '../services/supabase';

const Layout: React.FC = () => {
  const { userProfile, activeRole } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'de' : 'en');
  };

  // Use activeRole for view switching (falls back to primary role)
  const effectiveRole = activeRole || userProfile?.role;
  const isAthlete = effectiveRole === UserRole.ATHLETE;
  const isAdmin = effectiveRole === UserRole.ADMIN;

  // --- COACH / ADMIN NAVIGATION ---
  const desktopNavItems = [
    { label: t('nav.dashboard'), path: '/', icon: <LayoutDashboard size={20} /> },
    { label: t('nav.exercises'), path: '/exercises', icon: <Dumbbell size={20} /> },
    { label: t('nav.planner'), path: '/planner', icon: <Calendar size={20} /> },
    { label: t('nav.products'), path: '/admin/products', icon: <Package size={20} /> },
    { label: 'Kalender', path: '/calendar', icon: <CalendarClock size={20} /> },
    { label: 'Chat', path: '/coach/chat', icon: <MessageCircle size={20} /> },
  ];

  // Add consolidated CRM for Admins (merged Users + Assignments)
  if (isAdmin) {
      desktopNavItems.push({ label: 'CRM', path: '/admin/crm', icon: <Users size={20} /> });
  }

  const handleAthleteNav = (view: 'hub' | 'training') => {
      navigate('/', { state: { view } });
  };

  // Check current view from state (defaults to hub)
  const currentView = location.state?.view || 'hub';
  const isShopActive = location.pathname === '/shop';
  const isProfileActive = location.pathname === '/profile';
  const isChatActive = location.pathname === '/chat';
  const isPlannerActive = location.pathname === '/planner';
  const isHistoryActive = location.pathname === '/history';
  const isDashboardRoute = location.pathname === '/';

  const isImmersiveChat = isAthlete && isChatActive;

  // --- ATHLETE LAYOUT (Mobile App Style) ---
  if (isAthlete) {
      // Immersive fullscreen mode for chat (like WhatsApp)
      if (isImmersiveChat) {
        return (
          <div className="h-[100dvh] bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#00FF00] selection:text-black overflow-hidden">
            <Outlet />
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-[#00FF00] selection:text-black overflow-x-hidden">
            
            {/* Main Content - Full Height, safe area padding at bottom for nav */}
            <main className="flex-1 pb-32 px-6 pt-8 overflow-y-auto overflow-x-hidden safe-area-top">
                <div className="max-w-md mx-auto w-full h-full">
                   <Outlet />
                </div>
            </main>

            {/* Bottom Navigation Bar - Floating Glassmorphism */}
            <div className="fixed bottom-0 w-full z-40 px-4 pb-6 pt-2 pointer-events-none safe-area-bottom">
                <div className="max-w-md mx-auto pointer-events-auto">
                    <div className="bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl flex justify-between items-center px-6 py-4">
                        
                        {/* Home / Hub */}
                        <button 
                            onClick={() => handleAthleteNav('hub')}
                            className={`flex flex-col items-center gap-1 transition-all duration-300 ${!isShopActive && !isProfileActive && !isChatActive && !isPlannerActive && currentView === 'hub' ? 'text-[#00FF00] scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Home size={24} strokeWidth={!isShopActive && !isProfileActive && !isChatActive && !isPlannerActive && currentView === 'hub' ? 2.5 : 2} />
                        </button>

                        {/* Training View - Combined Calendar & Workout */}
                        <button 
                            onClick={() => handleAthleteNav('training')}
                            className={`flex flex-col items-center gap-1 transition-all duration-300 ${!isShopActive && !isProfileActive && !isChatActive && !isPlannerActive && currentView === 'training' ? 'text-[#00FF00] scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Calendar size={24} strokeWidth={!isShopActive && !isProfileActive && !isChatActive && !isPlannerActive && currentView === 'training' ? 2.5 : 2} />
                        </button>

                        <NavLink 
                            to="/chat"
                            className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[#00FF00] scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <MessageCircle size={24} strokeWidth={isChatActive ? 2.5 : 2} />
                        </NavLink>

                        <NavLink 
                            to="/history"
                            className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[#00FF00] scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <History size={24} strokeWidth={isHistoryActive ? 2.5 : 2} />
                        </NavLink>

                        <NavLink 
                            to="/profile"
                            className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[#00FF00] scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <User size={24} strokeWidth={isProfileActive ? 2.5 : 2} />
                        </NavLink>

                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- COACH & ADMIN: Mobile bottom tab items (5 max for native feel) ---
  const mobileTabItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={22} /> },
    { label: 'Planner', path: '/planner', icon: <Calendar size={22} /> },
    { label: 'Kalender', path: '/calendar', icon: <CalendarClock size={22} /> },
    { label: 'Chat', path: '/coach/chat', icon: <MessageCircle size={22} /> },
    ...(isAdmin 
      ? [{ label: 'CRM', path: '/admin/crm', icon: <Users size={22} /> }]
      : [{ label: 'Übungen', path: '/exercises', icon: <Dumbbell size={22} /> }]
    ),
  ];

  // Secondary items for the "more" menu (accessible via hamburger)
  const mobileOverflowItems = desktopNavItems.filter(
    item => !mobileTabItems.some(tab => tab.path === item.path)
  );

  // --- COACH & ADMIN LAYOUT (Desktop Sidebar + Mobile Bottom Tab Bar) ---
  return (
    <div className="min-h-screen flex bg-[#000000] text-zinc-200 font-sans selection:bg-[#00FF00] selection:text-black overflow-x-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-[#000000] fixed h-full z-20">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-white tracking-tighter">
            GREENLIGHT<span className="text-[#00FF00]">.</span>
          </h1>
          <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-[0.2em] font-medium">
            {isAdmin ? 'Admin Panel' : 'Coach Dashboard'}
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {desktopNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-[#00FF00] text-black font-semibold shadow-[0_0_15px_rgba(0,255,0,0.3)]' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`
              }
            >
              {item.icon}
              <span className="">{item.label}</span>
            </NavLink>
          ))}
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
              <Link to="/legal/privacy" className="hover:text-zinc-400">Privacy</Link>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar (Coach/Admin) — compact, with overflow menu */}
      <div className="md:hidden fixed top-0 w-full bg-[#000000]/95 backdrop-blur-md border-b border-zinc-800/50 z-30 safe-area-top">
        <div className="px-5 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold text-white tracking-tighter">
            GREENLIGHT<span className="text-[#00FF00]">.</span>
          </h1>
          <div className="flex gap-2 items-center">
            <button onClick={toggleLanguage} className="text-zinc-500 hover:text-white text-xs font-bold px-2 py-1.5 rounded-lg bg-zinc-900 transition-colors">
              {language === 'en' ? 'DE' : 'EN'}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white hover:text-[#00FF00] transition-colors p-2 -mr-2">
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overflow Menu (Coach/Admin) — slides over content */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#000000]/98 backdrop-blur-xl z-40 animate-in fade-in duration-200 safe-area-top" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="pt-20 px-5 pb-32" onClick={e => e.stopPropagation()}>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-2">Navigation</p>
            <nav className="space-y-1">
              {desktopNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                      isActive 
                        ? 'bg-[#00FF00] text-black font-bold' 
                        : 'text-zinc-300 hover:bg-zinc-900 active:bg-zinc-800'
                    }`
                  }
                >
                  {item.icon}
                  <span className="text-base font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-zinc-800 mt-6 pt-6 space-y-2">
              <button 
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-2xl w-full transition-colors"
              >
                <LogOut size={18} />
                <span className="font-medium">{t('nav.logout')}</span>
              </button>
              <div className="text-[10px] text-zinc-600 flex gap-2 justify-center pt-2">
                <Link to="/legal/imprint" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-zinc-400">Impressum</Link>
                <span>•</span>
                <Link to="/legal/privacy" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-zinc-400">Datenschutz</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar (Coach/Admin) — native iOS/Android style */}
      <div className="md:hidden fixed bottom-0 w-full z-30 safe-area-bottom">
        <div className="bg-[#0A0A0A]/95 backdrop-blur-2xl border-t border-zinc-800/60">
          <div className="flex justify-around items-center px-2 pt-2 pb-1">
            {mobileTabItems.map(item => {
              const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[56px] transition-all"
                >
                  <div className={`transition-all duration-200 ${isActive ? 'text-[#00FF00] scale-110' : 'text-zinc-500'}`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-[#00FF00]' : 'text-zinc-600'}`}>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content — padded for mobile top + bottom bars, desktop sidebar */}
      <main className="flex-1 md:ml-64 p-4 md:p-6 pt-20 md:pt-8 pb-24 md:pb-8 bg-[#000000] min-w-0 safe-area-top">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
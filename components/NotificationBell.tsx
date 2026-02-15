import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, supabase } from '../services/supabase';
import { Bell, Check, CheckCheck, Calendar, CalendarCheck, CalendarX, Clock, X, MessageSquare, UserPlus, ShoppingCart, ClipboardList } from 'lucide-react';
import { showLocalNotification } from '../services/notifications';

const ICON_MAP: Record<string, React.ReactNode> = {
  appointment_new: <Calendar size={14} className="text-blue-400" />,
  appointment_confirmed: <CalendarCheck size={14} className="text-[#00FF00]" />,
  appointment_cancelled: <CalendarX size={14} className="text-red-400" />,
  appointment_reminder: <Clock size={14} className="text-yellow-400" />,
  chat_message: <MessageSquare size={14} className="text-[#00FF00]" />,
  coach_assignment: <UserPlus size={14} className="text-blue-400" />,
  purchase: <ShoppingCart size={14} className="text-[#00FF00]" />,
  intake_form: <ClipboardList size={14} className="text-purple-400" />,
};

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload: any) => {
        loadUnreadCount();
        if (open) loadNotifications();
        // Trigger browser push notification if tab not focused
        if (document.hidden && payload.new) {
          showLocalNotification(payload.new.title || 'Greenlight Fitness', {
            body: payload.new.message || '',
            tag: payload.new.type || 'greenlight-notification',
            data: { url: '/calendar' },
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, open]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadUnreadCount = async () => {
    if (!user) return;
    try { const c = await getUnreadNotificationCount(user.id); setUnreadCount(c); } catch {}
  };

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try { const data = await getNotifications(user.id, 20); setNotifications(data); } catch {}
    finally { setLoading(false); }
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open) loadNotifications();
  };

  const handleMarkRead = async (id: string) => {
    try { await markNotificationRead(id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); setUnreadCount(prev => Math.max(0, prev - 1)); } catch {}
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try { await markAllNotificationsRead(user.id); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); setUnreadCount(0); } catch {}
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Jetzt';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  return (
    <div ref={ref} className="relative z-[100]">
      <button onClick={handleOpen} className="relative p-2 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#00FF00] text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-[#1C1C1E] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white">Benachrichtigungen</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[10px] text-zinc-500 hover:text-[#00FF00] transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-800">
                  <CheckCheck size={12} /> Alle gelesen
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-zinc-500 hover:text-white"><X size={14} /></button>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">Laden...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-zinc-600">
                <Bell size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">Keine Benachrichtigungen</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={`w-full text-left px-4 py-3 border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/50 ${!n.read ? 'bg-[#00FF00]/[0.03]' : ''}`}
                >
                  <div className="flex gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {ICON_MAP[n.type] || <Bell size={14} className="text-zinc-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-bold truncate ${!n.read ? 'text-white' : 'text-zinc-400'}`}>{n.title}</p>
                        <span className="text-[10px] text-zinc-600 shrink-0">{timeAgo(n.created_at)}</span>
                      </div>
                      <p className={`text-[11px] mt-0.5 leading-relaxed ${!n.read ? 'text-zinc-300' : 'text-zinc-500'}`}>{n.message}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[#00FF00] mt-1.5 shrink-0" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

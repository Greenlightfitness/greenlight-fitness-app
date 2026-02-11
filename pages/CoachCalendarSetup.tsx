import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getCoachCalendars, createCoachCalendar, updateCoachCalendar, deleteCoachCalendar,
  getCalendarAvailability, setCalendarAvailability,
  getCoachBlockedTimes, addCoachBlockedTime, deleteCoachBlockedTime,
  updateBookingSlug, getCoachAppointments, confirmAppointment, cancelAppointment,
  supabase,
} from '../services/supabase';
import Button from '../components/Button';
import Input from '../components/Input';
import {
  Calendar, Plus, Trash2, Save, Clock, ChevronLeft, ChevronRight, Settings, X,
  CalendarX, Loader2, Check, AlertCircle, Link2, Copy,
  ExternalLink, CheckCircle2, XCircle, Globe, Eye,
  ToggleLeft, ToggleRight, Zap, User
} from 'lucide-react';

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const DAY_LABELS_FULL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 - 21:00
const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

type ViewMode = 'calendar' | 'availability' | 'settings';

interface AvailSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

// ─── Mini Calendar Component ────────────────────────────────────────
const MiniCalendar: React.FC<{
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  appointments: any[];
}> = ({ selectedDate, onSelectDate, appointments }) => {
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const days = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    let startDow = first.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const result: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < startDow; i++) {
      result.push({ date: new Date(year, month, -startDow + i + 1), inMonth: false });
    }
    for (let d = 1; d <= last.getDate(); d++) {
      result.push({ date: new Date(year, month, d), inMonth: true });
    }
    while (result.length < 42) {
      const d = result.length - startDow - last.getDate() + 1;
      result.push({ date: new Date(year, month + 1, d), inMonth: false });
    }
    return result;
  }, [viewMonth]);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const selStr = selectedDate.toISOString().split('T')[0];

  const appointmentDates = useMemo(() => {
    const s = new Set<string>();
    appointments.forEach(a => s.add(a.date));
    return s;
  }, [appointments]);

  const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} className="p-1 hover:bg-zinc-800 rounded"><ChevronLeft size={14} className="text-zinc-400" /></button>
        <span className="text-xs font-bold text-zinc-300">{MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span>
        <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} className="p-1 hover:bg-zinc-800 rounded"><ChevronRight size={14} className="text-zinc-400" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['Mo','Di','Mi','Do','Fr','Sa','So'].map(d => (
          <div key={d} className="text-[9px] font-bold text-zinc-600 py-0.5">{d}</div>
        ))}
        {days.map(({ date, inMonth }, i) => {
          const ds = date.toISOString().split('T')[0];
          const isToday = ds === todayStr;
          const isSelected = ds === selStr;
          const hasAppt = appointmentDates.has(ds);
          return (
            <button
              key={i}
              onClick={() => onSelectDate(date)}
              className={`text-[11px] py-1 rounded transition-all relative ${
                !inMonth ? 'text-zinc-700' :
                isSelected ? 'bg-[#00FF00] text-black font-bold' :
                isToday ? 'bg-zinc-800 text-[#00FF00] font-bold' :
                'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {date.getDate()}
              {hasAppt && !isSelected && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────
const CoachCalendarSetup: React.FC = () => {
  const { user } = useAuth();
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<any | null>(null);
  const [availability, setAvailability] = useState<AvailSlot[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calendar view state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.getFullYear(), now.getMonth(), diff);
  });

  // Bookings
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  // Create Calendar Form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCalName, setNewCalName] = useState('');
  const [newCalDesc, setNewCalDesc] = useState('');
  const [newCalDuration, setNewCalDuration] = useState(30);
  const [newCalBuffer, setNewCalBuffer] = useState(0);
  const [newCalAdvance, setNewCalAdvance] = useState(60);
  const [newCalNotice, setNewCalNotice] = useState(24);

  // Blocked time form
  const [blockDate, setBlockDate] = useState('');
  const [blockAllDay, setBlockAllDay] = useState(true);
  const [blockStart, setBlockStart] = useState('09:00');
  const [blockEnd, setBlockEnd] = useState('17:00');
  const [blockReason, setBlockReason] = useState('');

  // Settings
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '', slot_duration_minutes: 30, buffer_minutes: 0, max_advance_days: 60, min_notice_hours: 24 });

  // Booking slug
  const [bookingSlug, setBookingSlug] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [slugSaving, setSlugSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Sidebar collapsed
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (user) { fetchCalendars(); fetchSlug(); fetchBookings(); }
  }, [user]);

  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => { setError(null); setSuccess(null); }, 4000);
      return () => clearTimeout(t);
    }
  }, [error, success]);

  const fetchCalendars = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getCoachCalendars(user.id);
      setCalendars(data);
      if (data.length > 0 && !selectedCalendar) setSelectedCalendar(data[0]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const fetchSlug = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('booking_slug').eq('id', user.id).single();
    if (data?.booking_slug) { setBookingSlug(data.booking_slug); setSlugInput(data.booking_slug); }
  };

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const data = await getCoachAppointments(user.id);
      setBookings(data);
    } catch (e: any) { setError(e.message); }
  };

  const handleSaveSlug = async () => {
    if (!user || !slugInput.trim()) return;
    const clean = slugInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    setSlugSaving(true);
    try {
      await updateBookingSlug(user.id, clean);
      setBookingSlug(clean); setSlugInput(clean);
      setSuccess('Booking-Link gespeichert!');
    } catch (e: any) {
      setError(e.message?.includes('duplicate') ? 'Dieser Link ist bereits vergeben.' : e.message);
    } finally { setSlugSaving(false); }
  };

  const copyBookingLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/book/${bookingSlug}`);
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleConfirmBooking = async (id: string) => {
    try { await confirmAppointment(id); setSuccess('Termin bestätigt!'); await fetchBookings(); } catch (e: any) { setError(e.message); }
  };

  const handleCancelBooking = async (id: string) => {
    const reason = prompt('Grund für die Absage (optional):');
    try { await cancelAppointment(id, reason || undefined); setSuccess('Termin abgesagt.'); await fetchBookings(); setSelectedBooking(null); } catch (e: any) { setError(e.message); }
  };

  const handleCreateCalendar = async () => {
    if (!user || !newCalName.trim()) return;
    setSaving(true);
    try {
      const cal = await createCoachCalendar({ coach_id: user.id, name: newCalName.trim(), description: newCalDesc.trim() || undefined, slot_duration_minutes: newCalDuration, buffer_minutes: newCalBuffer, max_advance_days: newCalAdvance, min_notice_hours: newCalNotice });
      setSuccess('Kalender erstellt!'); setShowCreateForm(false);
      setNewCalName(''); setNewCalDesc(''); setNewCalDuration(30); setNewCalBuffer(0); setNewCalAdvance(60); setNewCalNotice(24);
      await fetchCalendars();
      if (cal) setSelectedCalendar(cal);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDeleteCalendar = async (id: string) => {
    if (!confirm('Kalender wirklich löschen?')) return;
    try {
      await deleteCoachCalendar(id); setSuccess('Kalender gelöscht.');
      if (selectedCalendar?.id === id) setSelectedCalendar(calendars.find(c => c.id !== id) || null);
      await fetchCalendars();
    } catch (e: any) { setError(e.message); }
  };

  const handleTogglePublic = async (calId: string, currentValue: boolean) => {
    try { await updateCoachCalendar(calId, { is_public: !currentValue }); await fetchCalendars(); setSuccess(!currentValue ? 'Kalender öffentlich.' : 'Kalender privat.'); } catch (e: any) { setError(e.message); }
  };

  // --- Availability ---
  const loadAvailability = async (calId: string) => {
    try {
      const avail = await getCalendarAvailability(calId);
      setAvailability(avail.map((a: any) => ({ day_of_week: a.day_of_week, start_time: a.start_time, end_time: a.end_time })));
      if (user) { const blocked = await getCoachBlockedTimes(user.id); setBlockedTimes(blocked); }
    } catch (e: any) { setError(e.message); }
  };

  const toggleDayAvailability = (day: number) => {
    const daySlots = availability.filter(s => s.day_of_week === day);
    if (daySlots.length > 0) {
      setAvailability(prev => prev.filter(s => s.day_of_week !== day));
    } else {
      setAvailability(prev => [...prev, { day_of_week: day, start_time: '09:00', end_time: '17:00' }]);
    }
  };

  const addAvailSlot = (day: number) => {
    setAvailability(prev => [...prev, { day_of_week: day, start_time: '09:00', end_time: '17:00' }]);
  };

  const updateAvailSlot = (index: number, field: keyof AvailSlot, value: any) => {
    setAvailability(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeAvailSlot = (index: number) => {
    setAvailability(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAvailability = async () => {
    if (!selectedCalendar) return;
    setSaving(true);
    try { await setCalendarAvailability(selectedCalendar.id, availability); setSuccess('Verfügbarkeit gespeichert!'); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleSaveSettings = async () => {
    if (!selectedCalendar) return;
    setSaving(true);
    try {
      const updated = await updateCoachCalendar(selectedCalendar.id, settingsForm);
      setSelectedCalendar(updated); setSuccess('Einstellungen gespeichert!');
      await fetchCalendars();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleAddBlockedTime = async () => {
    if (!user || !blockDate) return;
    setSaving(true);
    try {
      await addCoachBlockedTime({ coach_id: user.id, blocked_date: blockDate, all_day: blockAllDay, start_time: blockAllDay ? undefined : blockStart, end_time: blockAllDay ? undefined : blockEnd, reason: blockReason || undefined });
      setBlockDate(''); setBlockReason(''); setBlockAllDay(true);
      const blocked = await getCoachBlockedTimes(user.id); setBlockedTimes(blocked);
      setSuccess('Blockzeit hinzugefügt.');
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDeleteBlocked = async (id: string) => {
    try { await deleteCoachBlockedTime(id); if (user) { const blocked = await getCoachBlockedTimes(user.id); setBlockedTimes(blocked); } }
    catch (e: any) { setError(e.message); }
  };

  // --- Week View Data ---
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  }), [weekStart]);

  const navigateWeek = (dir: 'prev' | 'next') => {
    setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + (dir === 'next' ? 7 : -7)); return d; });
  };

  const goToToday = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    setWeekStart(new Date(now.getFullYear(), now.getMonth(), diff));
    setSelectedDate(now);
  };

  const weekBookings = useMemo(() => {
    const start = weekDates[0].toISOString().split('T')[0];
    const end = weekDates[6].toISOString().split('T')[0];
    return bookings.filter(b => b.date >= start && b.date <= end && b.status !== 'CANCELLED');
  }, [bookings, weekDates]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Effect: load availability when switching to availability tab
  useEffect(() => {
    if (viewMode === 'availability' && selectedCalendar) {
      loadAvailability(selectedCalendar.id);
    }
  }, [viewMode, selectedCalendar?.id]);

  // Effect: load settings when switching to settings tab
  useEffect(() => {
    if (viewMode === 'settings' && selectedCalendar) {
      setSettingsForm({
        name: selectedCalendar.name, description: selectedCalendar.description || '',
        slot_duration_minutes: selectedCalendar.slot_duration_minutes, buffer_minutes: selectedCalendar.buffer_minutes,
        max_advance_days: selectedCalendar.max_advance_days, min_notice_hours: selectedCalendar.min_notice_hours,
      });
    }
  }, [viewMode, selectedCalendar?.id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-zinc-500"><Loader2 className="animate-spin mr-2" size={20} /> Laden...</div>;
  }

  return (
    <div className="animate-in fade-in pb-20">
      {/* Status Messages */}
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center gap-2 mb-4 text-sm"><AlertCircle size={14} /> {error}</div>}
      {success && <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 text-[#00FF00] p-3 rounded-xl flex items-center gap-2 mb-4 text-sm"><Check size={14} /> {success}</div>}

      {/* ═══ TOP BAR ═══ */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-white">Termine <span className="text-[#00FF00]">.</span></h1>
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {([['calendar', 'Kalender'], ['availability', 'Verfügbarkeit'], ['settings', 'Einstellungen']] as [ViewMode, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setViewMode(key)}
                className={`px-4 py-2 text-xs font-bold transition-colors ${viewMode === key ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:text-white'}`}
              >{label}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {bookingSlug && (
            <button onClick={copyBookingLink} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 hover:border-blue-500 transition-colors">
              {linkCopied ? <Check size={12} className="text-[#00FF00]" /> : <Link2 size={12} />}
              {linkCopied ? 'Kopiert!' : 'Buchungslink'}
            </button>
          )}
          <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#00FF00] text-black rounded-xl text-xs font-bold hover:bg-[#00FF00]/80 transition-colors">
            <Plus size={14} /> Kalender
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* ═══ LEFT SIDEBAR ═══ */}
        <div className={`shrink-0 transition-all ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
          <div className="space-y-4">
            {/* Mini Calendar */}
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-3">
              <MiniCalendar selectedDate={selectedDate} onSelectDate={(d) => {
                setSelectedDate(d);
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                setWeekStart(new Date(d.getFullYear(), d.getMonth(), diff));
              }} appointments={bookings} />
            </div>

            {/* Calendar List */}
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-3">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Kalender</p>
              <div className="space-y-1">
                {calendars.map(cal => (
                  <button key={cal.id} onClick={() => setSelectedCalendar(cal)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                      selectedCalendar?.id === cal.id ? 'bg-[#00FF00]/10 text-[#00FF00]' : 'text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${selectedCalendar?.id === cal.id ? 'bg-[#00FF00]' : 'bg-zinc-600'}`} />
                    <span className="truncate flex-1">{cal.name}</span>
                    <span className="text-[9px] text-zinc-600">{cal.slot_duration_minutes}m</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Booking Link */}
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-3">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Buchungslink</p>
              <div className="flex gap-1">
                <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden">
                  <span className="text-zinc-600 text-[9px] pl-1.5 shrink-0">/book/</span>
                  <input value={slugInput} onChange={e => setSlugInput(e.target.value)} placeholder="slug" className="flex-1 bg-transparent text-white text-[10px] py-1.5 pr-1 outline-none w-0" />
                </div>
                <button onClick={handleSaveSlug} disabled={slugSaving} className="px-2 py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-bold hover:bg-blue-400 disabled:opacity-50">
                  {slugSaving ? '...' : <Save size={10} />}
                </button>
              </div>
              {bookingSlug && (
                <a href={`/book/${bookingSlug}`} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-1">
                  Vorschau <ExternalLink size={8} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex-1 min-w-0">
          {viewMode === 'calendar' ? (
            <>
              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => navigateWeek('prev')} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"><ChevronLeft size={18} className="text-zinc-400" /></button>
                  <button onClick={() => navigateWeek('next')} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"><ChevronRight size={18} className="text-zinc-400" /></button>
                  <button onClick={goToToday} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-300 hover:border-[#00FF00] transition-colors">Heute</button>
                  <h2 className="text-lg font-bold text-white ml-2">
                    {weekDates[0].toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })} – {weekDates[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </h2>
                </div>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
                  <Eye size={16} />
                </button>
              </div>

              {/* ═══ WEEK VIEW GRID ═══ */}
              <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-zinc-800">
                  <div className="border-r border-zinc-800" />
                  {weekDates.map((d, i) => {
                    const ds = d.toISOString().split('T')[0];
                    const isToday = ds === todayStr;
                    return (
                      <div key={i} className={`py-2 px-1 text-center border-r border-zinc-800 last:border-r-0 ${isToday ? 'bg-[#00FF00]/5' : ''}`}>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">{DAY_LABELS[d.getDay()]}</p>
                        <p className={`text-lg font-bold ${isToday ? 'text-[#00FF00]' : 'text-white'}`}>{d.getDate()}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Time Grid */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] max-h-[600px] overflow-y-auto">
                  {HOURS.map(hour => (
                    <React.Fragment key={hour}>
                      <div className="border-r border-b border-zinc-800 py-3 pr-2 text-right">
                        <span className="text-[10px] text-zinc-600 font-mono">{String(hour).padStart(2, '0')}:00</span>
                      </div>
                      {weekDates.map((d, di) => {
                        const ds = d.toISOString().split('T')[0];
                        const isToday = ds === todayStr;
                        const hourBookings = weekBookings.filter(b => {
                          if (b.date !== ds) return false;
                          const [bh] = (b.time || '00:00').split(':').map(Number);
                          return bh === hour;
                        });

                        return (
                          <div key={di} className={`border-r border-b border-zinc-800 last:border-r-0 min-h-[48px] relative ${isToday ? 'bg-[#00FF00]/[0.02]' : ''}`}>
                            {hourBookings.map(b => {
                              const isPending = b.status === 'PENDING';
                              const [, bm] = (b.time || '00:00').split(':').map(Number);
                              const topOffset = (bm / 60) * 100;
                              const height = Math.max(((b.duration_minutes || 30) / 60) * 100, 40);
                              return (
                                <button key={b.id} onClick={() => setSelectedBooking(b)}
                                  className={`absolute left-0.5 right-0.5 rounded-lg px-1.5 py-0.5 text-left transition-all hover:ring-2 hover:ring-white/20 overflow-hidden z-10 ${
                                    isPending ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-200' : 'bg-blue-500/20 border border-blue-500/30 text-blue-200'
                                  }`}
                                  style={{ top: `${topOffset}%`, height: `${height}%`, minHeight: '20px' }}
                                >
                                  <p className="text-[10px] font-bold truncate">{b.booker_name || b.athlete_name || '?'}</p>
                                  <p className="text-[9px] opacity-70">{b.time}</p>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* No bookings hint */}
              {weekBookings.length === 0 && (
                <div className="text-center py-6 text-zinc-600 text-sm">
                  <Calendar size={24} className="mx-auto mb-2 opacity-50" />
                  Keine Termine diese Woche
                </div>
              )}
            </>
          ) : viewMode === 'availability' ? (
            /* ═══ AVAILABILITY VIEW ═══ */
            selectedCalendar ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedCalendar.name}</h2>
                    <p className="text-zinc-500 text-xs">Wöchentliche Verfügbarkeit festlegen</p>
                  </div>
                  <Button onClick={handleSaveAvailability} disabled={saving}>
                    <Save size={14} className="mr-1" /> {saving ? 'Speichern...' : 'Speichern'}
                  </Button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setAvailability([1,2,3,4,5].map(d => ({ day_of_week: d, start_time: '09:00', end_time: '17:00' }))); }}
                    className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors flex items-center gap-1">
                    <Zap size={10} /> Mo–Fr 9–17
                  </button>
                  <button onClick={() => { setAvailability([1,2,3,4,5].flatMap(d => [{ day_of_week: d, start_time: '09:00', end_time: '12:00' }, { day_of_week: d, start_time: '14:00', end_time: '18:00' }])); }}
                    className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors flex items-center gap-1">
                    <Zap size={10} /> Mo–Fr Split
                  </button>
                  <button onClick={() => setAvailability([])}
                    className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors">
                    Alles löschen
                  </button>
                </div>

                {/* Day Rows with Toggle */}
                <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl divide-y divide-zinc-800">
                  {[1, 2, 3, 4, 5, 6, 0].map(day => {
                    const daySlots = availability.filter(s => s.day_of_week === day);
                    const hasSlots = daySlots.length > 0;
                    return (
                      <div key={day} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button onClick={() => toggleDayAvailability(day)} className="text-zinc-400 hover:text-[#00FF00] transition-colors">
                              {hasSlots ? <ToggleRight size={22} className="text-[#00FF00]" /> : <ToggleLeft size={22} />}
                            </button>
                            <span className={`text-sm font-bold w-28 ${hasSlots ? 'text-white' : 'text-zinc-500'}`}>
                              {DAY_LABELS_FULL[day]}
                            </span>
                            {!hasSlots && <span className="text-xs text-zinc-600">Nicht verfügbar</span>}
                          </div>
                          {hasSlots && (
                            <button onClick={() => addAvailSlot(day)} className="text-xs text-zinc-500 hover:text-[#00FF00] transition-colors flex items-center gap-1">
                              <Plus size={12} /> Zeitfenster
                            </button>
                          )}
                        </div>
                        {hasSlots && (
                          <div className="mt-2 ml-[52px] space-y-2">
                            {availability.map((slot, idx) => {
                              if (slot.day_of_week !== day) return null;
                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <select value={slot.start_time} onChange={e => updateAvailSlot(idx, 'start_time', e.target.value)}
                                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs focus:border-[#00FF00] outline-none">
                                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                  <span className="text-zinc-600 text-xs">–</span>
                                  <select value={slot.end_time} onChange={e => updateAvailSlot(idx, 'end_time', e.target.value)}
                                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs focus:border-[#00FF00] outline-none">
                                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                  <button onClick={() => removeAvailSlot(idx)} className="p-1 text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Blocked Times */}
                <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><CalendarX size={14} className="text-red-400" /> Blockzeiten</h3>
                  <div className="flex flex-wrap gap-2 mb-3 items-end">
                    <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs focus:border-[#00FF00] outline-none [color-scheme:dark]" />
                    <label className="flex items-center gap-1 text-xs text-zinc-400">
                      <input type="checkbox" checked={blockAllDay} onChange={e => setBlockAllDay(e.target.checked)} className="accent-[#00FF00]" /> Ganzer Tag
                    </label>
                    {!blockAllDay && (
                      <>
                        <select value={blockStart} onChange={e => setBlockStart(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs">{TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}</select>
                        <span className="text-zinc-600 text-xs">–</span>
                        <select value={blockEnd} onChange={e => setBlockEnd(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs">{TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}</select>
                      </>
                    )}
                    <input value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="Grund" className="flex-1 min-w-[100px] bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-[#00FF00]" />
                    <button onClick={handleAddBlockedTime} disabled={!blockDate || saving} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 disabled:opacity-50 transition-colors">Sperren</button>
                  </div>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto">
                    {blockedTimes.filter(b => b.blocked_date >= todayStr).map(bt => (
                      <div key={bt.id} className="flex items-center justify-between bg-zinc-900/50 rounded-lg px-2 py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <CalendarX size={10} className="text-red-400" />
                          <span className="text-zinc-300">{new Date(bt.blocked_date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                          {bt.all_day ? <span className="text-red-400 text-[10px]">Ganzer Tag</span> : <span className="text-zinc-500">{bt.start_time}–{bt.end_time}</span>}
                          {bt.reason && <span className="text-zinc-600">({bt.reason})</span>}
                        </div>
                        <button onClick={() => handleDeleteBlocked(bt.id)} className="text-zinc-600 hover:text-red-400"><Trash2 size={10} /></button>
                      </div>
                    ))}
                    {blockedTimes.filter(b => b.blocked_date >= todayStr).length === 0 && <p className="text-zinc-600 text-xs italic">Keine Blockzeiten.</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-zinc-600"><Calendar size={40} className="mx-auto mb-3 opacity-50" /><p>Wähle links einen Kalender aus.</p></div>
            )
          ) : (
            /* ═══ SETTINGS VIEW ═══ */
            selectedCalendar ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Kalender-Einstellungen</h2>

                <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 mb-1 block">Name</label>
                    <Input value={settingsForm.name} onChange={e => setSettingsForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 mb-1 block">Beschreibung</label>
                    <Input value={settingsForm.description} onChange={e => setSettingsForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 mb-1 block">Slot-Dauer</label>
                      <select value={settingsForm.slot_duration_minutes} onChange={e => setSettingsForm(p => ({ ...p, slot_duration_minutes: Number(e.target.value) }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-sm">
                        {[15,30,45,60,90].map(v => <option key={v} value={v}>{v} Min</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 mb-1 block">Puffer</label>
                      <select value={settingsForm.buffer_minutes} onChange={e => setSettingsForm(p => ({ ...p, buffer_minutes: Number(e.target.value) }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-sm">
                        {[0,5,10,15,30].map(v => <option key={v} value={v}>{v} Min</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 mb-1 block">Max. Vorlauf</label>
                      <Input type="number" value={settingsForm.max_advance_days} onChange={e => setSettingsForm(p => ({ ...p, max_advance_days: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 mb-1 block">Min. Vorlauf (Std)</label>
                      <Input type="number" value={settingsForm.min_notice_hours} onChange={e => setSettingsForm(p => ({ ...p, min_notice_hours: Number(e.target.value) }))} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleTogglePublic(selectedCalendar.id, selectedCalendar.is_public !== false)}
                        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                        {selectedCalendar.is_public !== false ? <ToggleRight size={20} className="text-[#00FF00]" /> : <ToggleLeft size={20} />}
                        {selectedCalendar.is_public !== false ? 'Öffentlich' : 'Privat'}
                      </button>
                    </div>
                    <button onClick={() => handleDeleteCalendar(selectedCalendar.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                      <Trash2 size={12} /> Kalender löschen
                    </button>
                  </div>

                  <Button onClick={handleSaveSettings} disabled={saving} fullWidth>
                    {saving ? 'Speichern...' : 'Einstellungen speichern'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-zinc-600"><Settings size={40} className="mx-auto mb-3 opacity-50" /><p>Wähle links einen Kalender aus.</p></div>
            )
          )}
        </div>
      </div>

      {/* ═══ BOOKING DETAIL MODAL ═══ */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">Termindetails</h3>
              <button onClick={() => setSelectedBooking(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                  selectedBooking.status === 'CONFIRMED' ? 'bg-[#00FF00]/10 text-[#00FF00]' : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {(selectedBooking.booker_name || selectedBooking.athlete_name || '?')[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold">{selectedBooking.booker_name || selectedBooking.athlete_name || 'Unbekannt'}</p>
                  {selectedBooking.booker_email && <p className="text-zinc-500 text-xs">{selectedBooking.booker_email}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 rounded-xl p-3">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Datum</p>
                  <p className="text-white text-sm font-medium">{new Date(selectedBooking.date + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long' })}</p>
                </div>
                <div className="bg-zinc-900 rounded-xl p-3">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Uhrzeit</p>
                  <p className="text-white text-sm font-medium">{selectedBooking.time} Uhr · {selectedBooking.duration_minutes} Min</p>
                </div>
              </div>
              <div className="bg-zinc-900 rounded-xl p-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Status</p>
                <span className={`inline-block mt-1 text-xs font-bold px-2 py-1 rounded ${
                  selectedBooking.status === 'CONFIRMED' ? 'bg-[#00FF00]/10 text-[#00FF00]' :
                  selectedBooking.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}>{selectedBooking.status === 'CONFIRMED' ? 'Bestätigt' : selectedBooking.status === 'PENDING' ? 'Ausstehend' : 'Abgesagt'}</span>
              </div>
              {selectedBooking.notes && (
                <div className="bg-zinc-900 rounded-xl p-3">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Notizen</p>
                  <p className="text-zinc-300 text-sm mt-1">{selectedBooking.notes}</p>
                </div>
              )}
              {selectedBooking.status !== 'CANCELLED' && (
                <div className="flex gap-2">
                  {selectedBooking.status === 'PENDING' && (
                    <button onClick={() => { handleConfirmBooking(selectedBooking.id); setSelectedBooking(null); }}
                      className="flex-1 py-3 bg-[#00FF00] text-black rounded-xl font-bold hover:bg-[#00FF00]/90 transition-colors flex items-center justify-center gap-1">
                      <CheckCircle2 size={16} /> Bestätigen
                    </button>
                  )}
                  <button onClick={() => handleCancelBooking(selectedBooking.id)}
                    className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-xl font-bold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-1">
                    <XCircle size={16} /> Absagen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CREATE CALENDAR MODAL ═══ */}
      {showCreateForm && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6 max-w-lg w-full animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-white">Neuen Kalender erstellen</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Name *</label>
                <Input value={newCalName} onChange={e => setNewCalName(e.target.value)} placeholder="z.B. Erstgespräch, 1:1 Check-in" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Beschreibung</label>
                <Input value={newCalDesc} onChange={e => setNewCalDesc(e.target.value)} placeholder="Optional" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Slot-Dauer</label>
                  <select value={newCalDuration} onChange={e => setNewCalDuration(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-sm">
                    {[15,30,45,60,90].map(v => <option key={v} value={v}>{v} Min</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Puffer</label>
                  <select value={newCalBuffer} onChange={e => setNewCalBuffer(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-sm">
                    {[0,5,10,15,30].map(v => <option key={v} value={v}>{v} Min</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Max. Vorlauf (Tage)</label>
                  <Input type="number" value={newCalAdvance} onChange={e => setNewCalAdvance(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Min. Vorlauf (Std)</label>
                  <Input type="number" value={newCalNotice} onChange={e => setNewCalNotice(Number(e.target.value))} />
                </div>
              </div>
              <Button onClick={handleCreateCalendar} disabled={!newCalName.trim() || saving} fullWidth>
                {saving ? 'Erstelle...' : 'Kalender erstellen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachCalendarSetup;

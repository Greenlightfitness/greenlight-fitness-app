import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCoachBySlug, getPublicCalendars, getCalendarById, getAvailableSlots, getDatesWithAvailability, createPublicAppointment } from '../services/supabase';
import BookingWidget from '../components/BookingWidget';
import { Calendar, Clock, User, CheckCircle2, ChevronLeft, Loader2, ArrowRight, Send, AlertCircle } from 'lucide-react';

type Step = 'loading' | 'select-calendar' | 'select-slot' | 'confirm' | 'success' | 'error';

const PublicBooking: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('loading');
  const [coach, setCoach] = useState<any>(null);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Booking form
  const [bookerName, setBookerName] = useState('');
  const [bookerEmail, setBookerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (slug) loadCoachData(slug);
  }, [slug]);

  const loadCoachData = async (s: string) => {
    try {
      const coachData = await getCoachBySlug(s);
      if (!coachData) {
        setStep('error');
        setErrorMsg('Dieser Buchungslink existiert nicht.');
        return;
      }
      setCoach(coachData);

      const cals = await getPublicCalendars(coachData.id);
      setCalendars(cals);

      if (cals.length === 1) {
        // Auto-select if only one calendar
        setSelectedCalendar(cals[0]);
        setStep('select-slot');
      } else if (cals.length === 0) {
        setStep('error');
        setErrorMsg('Dieser Coach hat keine öffentlichen Kalender.');
      } else {
        setStep('select-calendar');
      }
    } catch (e) {
      console.error(e);
      setStep('error');
      setErrorMsg('Fehler beim Laden der Buchungsdaten.');
    }
  };

  const handleSelectCalendar = (cal: any) => {
    setSelectedCalendar(cal);
    setStep('select-slot');
  };

  const handleSlotSelected = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep('confirm');
  };

  // Build calendar URLs for email
  const buildCalendarUrls = (date: string, time: string, durationMinutes: number, title: string, description: string) => {
    const [h, m] = time.split(':').map(Number);
    const start = new Date(date + 'T00:00:00');
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(description)}`;

    const outlookCalendarUrl = `https://outlook.live.com/calendar/0/action/compose?subject=${encodeURIComponent(title)}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&body=${encodeURIComponent(description)}`;

    const icsContent = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Greenlight Fitness//Booking//DE',
      'BEGIN:VEVENT',
      `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
      `SUMMARY:${title}`, `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const icsDownloadUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;

    return { googleCalendarUrl, outlookCalendarUrl, icsDownloadUrl };
  };

  const handleSubmitBooking = async () => {
    if (!bookerName.trim() || !bookerEmail.trim() || !selectedCalendar || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const durationMinutes = selectedCalendar.slot_duration_minutes || 30;

      await createPublicAppointment({
        coach_id: coach.id,
        calendar_id: selectedCalendar.id,
        date: selectedDate,
        time: selectedTime,
        duration_minutes: durationMinutes,
        booker_name: bookerName.trim(),
        booker_email: bookerEmail.trim(),
        notes: notes.trim() || undefined,
      });

      // Send confirmation email with calendar links
      try {
        const title = `${selectedCalendar.name} – ${coachDisplayName}`;
        const description = `Termin bei ${coachDisplayName}\n${selectedCalendar.name}\nDauer: ${durationMinutes} Min`;
        const calUrls = buildCalendarUrls(selectedDate, selectedTime, durationMinutes, title, description);

        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'booking_confirmation',
            to: bookerEmail.trim(),
            data: {
              bookerName: bookerName.trim(),
              coachName: coachDisplayName,
              calendarName: selectedCalendar.name,
              date: selectedDate,
              time: selectedTime,
              durationMinutes,
              notes: notes.trim() || undefined,
              ...calUrls,
            },
          }),
        });
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr);
      }

      setStep('success');
    } catch (e: any) {
      console.error(e);
      setErrorMsg('Fehler beim Buchen. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  const coachDisplayName = coach
    ? (coach.first_name ? `${coach.first_name} ${coach.last_name || ''}`.trim() : coach.nickname || coach.email?.split('@')[0])
    : '';

  // --- LOADING ---
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#00FF00]" />
      </div>
    );
  }

  // --- ERROR ---
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Seite nicht gefunden</h1>
          <p className="text-zinc-400 mb-6">{errorMsg}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors font-medium"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    );
  }

  // --- SUCCESS ---
  if (step === 'success') {
    const dateObj = new Date(selectedDate + 'T00:00:00');
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <div className="bg-[#1C1C1E] border border-[#00FF00]/30 rounded-3xl p-8 max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4">
          <div className="w-20 h-20 bg-[#00FF00]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-[#00FF00]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Termin gebucht!</h1>
          <p className="text-zinc-400 mb-6">
            Dein Termin bei <span className="text-white font-medium">{coachDisplayName}</span> wurde erfolgreich gebucht.
          </p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-[#00FF00]" />
              <span className="text-white font-medium">
                {dateObj.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-[#00FF00]" />
              <span className="text-white font-medium">{selectedTime} Uhr ({selectedCalendar?.slot_duration_minutes || 30} Min)</span>
            </div>
            <div className="flex items-center gap-3">
              <User size={16} className="text-[#00FF00]" />
              <span className="text-white font-medium">{selectedCalendar?.name}</span>
            </div>
          </div>

          <p className="text-zinc-500 text-sm mb-4">
            Du erhältst eine Bestätigung per E-Mail an <span className="text-white">{bookerEmail}</span>.
          </p>

          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors font-medium"
          >
            Fenster schließen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Top Bar */}
      <div className="border-b border-zinc-800 bg-[#1C1C1E]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#00FF00]/10 border border-[#00FF00]/20 flex items-center justify-center text-[#00FF00] font-bold">
            {coachDisplayName[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-white font-bold">{coachDisplayName}</h1>
            <p className="text-zinc-500 text-xs">Termin online buchen</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 pb-20">
        {/* Breadcrumb */}
        {step !== 'select-calendar' && calendars.length > 1 && (
          <button
            onClick={() => {
              if (step === 'confirm') setStep('select-slot');
              else if (step === 'select-slot') { setStep('select-calendar'); setSelectedCalendar(null); }
            }}
            className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft size={16} /> Zurück
          </button>
        )}
        {step === 'confirm' && (
          <button
            onClick={() => setStep('select-slot')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft size={16} /> Andere Zeit wählen
          </button>
        )}

        {/* STEP: Select Calendar */}
        {step === 'select-calendar' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Terminart wählen</h2>
              <p className="text-zinc-400">Wähle die Art des Termins, den du buchen möchtest.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {calendars.map(cal => (
                <button
                  key={cal.id}
                  onClick={() => handleSelectCalendar(cal)}
                  className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6 text-left hover:border-[#00FF00]/50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-[#00FF00]/10 rounded-xl group-hover:scale-110 transition-transform">
                      <Calendar size={20} className="text-[#00FF00]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white group-hover:text-[#00FF00] transition-colors">{cal.name}</h3>
                      {cal.description && <p className="text-xs text-zinc-500 mt-0.5">{cal.description}</p>}
                    </div>
                    <ArrowRight size={16} className="text-zinc-600 group-hover:text-[#00FF00] transition-colors" />
                  </div>
                  <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded flex items-center gap-1">
                      <Clock size={8} /> {cal.slot_duration_minutes} Min
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: Select Slot */}
        {step === 'select-slot' && selectedCalendar && (
          <div className="animate-in fade-in">
            <BookingWidget
              calendarId={selectedCalendar.id}
              calendarName={selectedCalendar.name}
              slotDuration={selectedCalendar.slot_duration_minutes}
              onSelectSlot={handleSlotSelected}
              onCancel={calendars.length > 1 ? () => { setStep('select-calendar'); setSelectedCalendar(null); } : undefined}
            />
          </div>
        )}

        {/* STEP: Confirm & Enter Details */}
        {step === 'confirm' && (
          <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-3xl p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Termin bestätigen</h2>
                <p className="text-zinc-400 text-sm">Bitte gib deine Kontaktdaten ein.</p>
              </div>

              {/* Selected Slot Summary */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-[#00FF00]" />
                  <span className="text-white font-medium">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm mt-2">
                  <Clock size={16} className="text-[#00FF00]" />
                  <span className="text-white font-medium">{selectedTime} Uhr &bull; {selectedCalendar?.slot_duration_minutes || 30} Min</span>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Name *</label>
                  <input
                    value={bookerName}
                    onChange={e => setBookerName(e.target.value)}
                    placeholder="Max Mustermann"
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">E-Mail *</label>
                  <input
                    type="email"
                    value={bookerEmail}
                    onChange={e => setBookerEmail(e.target.value)}
                    placeholder="max@beispiel.de"
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Nachricht (optional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Gibt es etwas, das der Coach wissen sollte?"
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none resize-none"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} /> {errorMsg}
                </div>
              )}

              <button
                onClick={handleSubmitBooking}
                disabled={!bookerName.trim() || !bookerEmail.trim() || submitting}
                className="w-full py-4 bg-[#00FF00] text-black font-bold rounded-xl hover:bg-[#00FF00]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
              >
                {submitting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} /> Termin buchen
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-[#121212] py-3">
        <p className="text-center text-zinc-700 text-xs">
          Powered by <span className="text-[#00FF00] font-bold">Greenlight Fitness</span>
        </p>
      </div>
    </div>
  );
};

export default PublicBooking;

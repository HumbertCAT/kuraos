'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, Clock, X, CalendarDays, CalendarCheck, Trash2, Ban, Settings2, ChevronDown, Link2 } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';

import { API_URL } from '@/lib/api';
const locales = { es, en: enUS };

interface AvailabilityBlock {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  schedule_id: string;
}

interface TimeOff {
  id: string;
  start_datetime: string;
  end_datetime: string;
  reason: string | null;
}

interface SpecificAvailability {
  id: string;
  start_datetime: string;
  end_datetime: string;
}

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  patient_name?: string;
  service_title?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'availability' | 'time-off' | 'booking' | 'specific';
  resource?: any;
}

interface Schedule {
  id: string;
  name: string;
  is_default: boolean;
  blocks_count: number;
}

export default function CalendarPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const t = useTranslations('Calendar');

  const localizer = useMemo(() => dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
  }), []);

  // Tab state
  const [activeTab, setActiveTab] = useState<'availability' | 'bookings'>('availability');

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<typeof Views[keyof typeof Views]>(Views.WEEK);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Data state
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [specificAvailability, setSpecificAvailability] = useState<SpecificAvailability[]>([]);
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showSpecificModal, setShowSpecificModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [newRecurring, setNewRecurring] = useState({ day_of_week: 0, start_time: '09:00', end_time: '17:00' });
  const [newSpecific, setNewSpecific] = useState({ start: '', end: '' });
  const [newBlock, setNewBlock] = useState({ start: '', end: '', reason: '' });

  // Google Calendar state
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleCalendars, setGoogleCalendars] = useState<{ id: string; name: string; primary: boolean }[]>([]);
  const [blockingCalendarIds, setBlockingCalendarIds] = useState<string[]>([]);
  const [showScheduleMenu, setShowScheduleMenu] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');

  const dayNames = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Build calendar events based on active tab
    const calendarEvents: CalendarEvent[] = [];

    if (activeTab === 'bookings') {
      // Only show bookings
      bookings.forEach(b => {
        calendarEvents.push({
          id: `booking-${b.id}`,
          title: `📅 ${b.patient_name || 'Booking'}`,
          start: new Date(b.start_time),
          end: new Date(b.end_time),
          type: 'booking',
          resource: b,
        });
      });
    } else {
      // Show availability, specific dates, and blocks
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Recurring availability - filter by selected schedule
      for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
        availabilityBlocks
          .filter(b => b.day_of_week === dayOfWeek && b.schedule_id === currentScheduleId)
          .forEach(block => {
            const [startH, startM] = block.start_time.split(':').map(Number);
            const [endH, endM] = block.end_time.split(':').map(Number);
            calendarEvents.push({
              id: `avail-${block.id}-${d.toISOString()}`,
              title: t('tabAvailability'),
              start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), startH, startM),
              end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), endH, endM),
              type: 'availability',
            });
          });
      }

      // Specific availability
      specificAvailability.forEach(sa => {
        calendarEvents.push({
          id: `specific-${sa.id}`,
          title: `✨ ${t('specificDates')}`,
          start: new Date(sa.start_datetime),
          end: new Date(sa.end_datetime),
          type: 'specific',
        });
      });

      // Blocks (TimeOff)
      timeOffs.forEach(to => {
        calendarEvents.push({
          id: `block-${to.id}`,
          title: `🚫 ${to.reason || t('dateBlocks')}`,
          start: new Date(to.start_datetime),
          end: new Date(to.end_datetime),
          type: 'time-off',
        });
      });
    }

    setEvents(calendarEvents);
  }, [availabilityBlocks, specificAvailability, timeOffs, bookings, currentDate, activeTab, currentScheduleId, t]);

  async function loadData() {
    setLoading(true);
    try {
      // First load schedules to get default
      const schedulesRes = await fetch(`${API_URL}/schedules/`, { credentials: 'include' });
      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json();
        setSchedules(schedulesData);
        // Set current schedule to default if not set
        if (!currentScheduleId && schedulesData.length > 0) {
          const defaultSchedule = schedulesData.find((s: Schedule) => s.is_default) || schedulesData[0];
          setCurrentScheduleId(defaultSchedule.id);
        }
      }

      const [blocksRes, specificRes, timeOffRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/availability/blocks`, { credentials: 'include' }),
        fetch(`${API_URL}/availability/specific`, { credentials: 'include' }),
        fetch(`${API_URL}/availability/time-off`, { credentials: 'include' }),
        fetch(`${API_URL}/booking/`, { credentials: 'include' }),
      ]);

      if (blocksRes.ok) setAvailabilityBlocks(await blocksRes.json());
      if (specificRes.ok) setSpecificAvailability(await specificRes.json());
      if (timeOffRes.ok) setTimeOffs(await timeOffRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());

      // Load Google Calendar data
      await loadGoogleCalendars();
    } catch (err) {
      console.error('Error loading calendar data', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadGoogleCalendars() {
    try {
      // Check if connected
      const statusRes = await fetch(`${API_URL}/integrations/google/status`, { credentials: 'include' });
      if (statusRes.ok) {
        const status = await statusRes.json();
        setGoogleConnected(status.connected);

        if (status.connected) {
          // Load calendars
          const calRes = await fetch(`${API_URL}/integrations/google/calendars`, { credentials: 'include' });
          if (calRes.ok) {
            const data = await calRes.json();
            setGoogleCalendars(data.calendars || []);
          }

          // Load current schedule sync config
          if (currentScheduleId) {
            const fullStatusRes = await fetch(`${API_URL}/integrations/google/full-status`, { credentials: 'include' });
            if (fullStatusRes.ok) {
              const fullStatus = await fullStatusRes.json();
              const scheduleSync = fullStatus.schedule_syncs?.find((s: any) => s.schedule_id === currentScheduleId);
              if (scheduleSync) {
                setBlockingCalendarIds(scheduleSync.blocking_calendar_ids || []);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading Google calendars', err);
    }
  }

  async function handleUpdateBlockingCalendars(calendarIds: string[]) {
    if (!currentScheduleId) return;

    try {
      await fetch(`${API_URL}/integrations/google/schedule/${currentScheduleId}/sync`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ blocking_calendar_ids: calendarIds }),
      });
    } catch (err) {
      console.error('Error updating blocking calendars', err);
    }
  }


  // === CRUD Functions ===
  async function handleAddRecurring(e: React.FormEvent) {
    e.preventDefault();
    if (!currentScheduleId) {
      console.error('No schedule selected');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/availability/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...newRecurring, schedule_id: currentScheduleId }),
      });
      if (res.ok) {
        await loadData();
        setShowRecurringModal(false);
        setNewRecurring({ day_of_week: 0, start_time: '09:00', end_time: '17:00' });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRecurring(id: string) {
    if (!confirm(t('delete') + '?')) return;
    await fetch(`${API_URL}/availability/blocks/${id}`, { method: 'DELETE', credentials: 'include' });
    await loadData();
  }

  async function handleAddSpecific(e: React.FormEvent) {
    e.preventDefault();
    if (!newSpecific.start || !newSpecific.end) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/availability/specific`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          start_datetime: new Date(newSpecific.start).toISOString(),
          end_datetime: new Date(newSpecific.end).toISOString(),
        }),
      });
      if (res.ok) {
        await loadData();
        setShowSpecificModal(false);
        setNewSpecific({ start: '', end: '' });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSpecific(id: string) {
    if (!confirm(t('delete') + '?')) return;
    await fetch(`${API_URL}/availability/specific/${id}`, { method: 'DELETE', credentials: 'include' });
    await loadData();
  }

  async function handleAddBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!newBlock.start || !newBlock.end) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/availability/time-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          start_datetime: new Date(newBlock.start).toISOString(),
          end_datetime: new Date(newBlock.end).toISOString(),
          reason: newBlock.reason || null,
        }),
      });
      if (res.ok) {
        await loadData();
        setShowBlockModal(false);
        setNewBlock({ start: '', end: '', reason: '' });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBlock(id: string) {
    if (!confirm(t('delete') + '?')) return;
    await fetch(`${API_URL}/availability/time-off/${id}`, { method: 'DELETE', credentials: 'include' });
    await loadData();
  }

  function eventStyleGetter(event: CalendarEvent) {
    let style: React.CSSProperties = { borderRadius: '4px', border: 'none', fontSize: '12px' };
    switch (event.type) {
      case 'availability':
        style.backgroundColor = '#10b981';
        style.color = 'white';
        break;
      case 'specific':
        style.backgroundColor = '#8b5cf6';
        style.color = 'white';
        break;
      case 'time-off':
        style.backgroundColor = '#ef4444';
        style.color = 'white';
        break;
      case 'booking':
        style.backgroundColor = '#3b82f6';
        style.color = 'white';
        break;
    }
    return { style };
  }

  if (loading) {
    return <div className="p-6 text-center text-foreground/60">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center">
          <CalendarDays className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground ">{t('title')}</h1>
          <p className="text-sm text-foreground/60 dark:text-muted-foreground">{t('subtitle') || 'Configura tu disponibilidad y sincroniza con Google Calendar'}</p>
        </div>
      </div>

      {/* Schedule Selector - Centered between header and content */}
      {activeTab === 'availability' && (
        <div className="mt-6 mb-8 bg-surface border border-border-subtle rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Title and description */}
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Settings2 size={20} className="text-purple-600" />
                {t('selectSchedule') || 'Seleccionar Horario'}
              </h3>
              <p className="text-sm text-foreground/60 mt-1">
                {t('scheduleDescription')}
              </p>
            </div>

            {/* Right: Schedule tabs */}
            <div className="flex items-center gap-2">
              {schedules.map(s => (
                <button
                  key={s.id}
                  onClick={() => setCurrentScheduleId(s.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${s.id === currentScheduleId
                    ? 'bg-purple-600 text-foreground shadow-md'
                    : 'bg-muted text-foreground hover:bg-muted'
                    }`}
                >
                  {s.name}
                  {s.is_default && (
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${s.id === currentScheduleId ? 'bg-card/20' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                      ✓
                    </span>
                  )}
                </button>
              ))}

              {/* New schedule button */}
              <div className="relative">
                <button
                  onClick={() => setShowScheduleMenu(!showScheduleMenu)}
                  className="p-2 bg-muted hover:bg-muted rounded-lg transition-colors"
                  title={t('createSchedule') || 'Create Schedule'}
                >
                  <Plus size={20} className="text-foreground/70" />
                </button>

                {showScheduleMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-card border rounded-xl shadow-lg z-50 p-3">
                    <input
                      type="text"
                      placeholder={t('newSchedulePlaceholder') || 'New schedule name...'}
                      value={newScheduleName}
                      onChange={e => setNewScheduleName(e.target.value)}
                      className="w-full p-2 text-sm border rounded-lg mb-2"
                      autoFocus
                    />
                    <button
                      disabled={!newScheduleName.trim()}
                      onClick={async () => {
                        if (!newScheduleName.trim()) return;
                        const res = await fetch(`${API_URL}/schedules/`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ name: newScheduleName }),
                        });
                        if (res.ok) {
                          const created = await res.json();
                          setSchedules([...schedules, created]);
                          setCurrentScheduleId(created.id);
                          setNewScheduleName('');
                          setShowScheduleMenu(false);
                        }
                      }}
                      className="w-full p-2 bg-purple-600 text-foreground rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      {t('createSchedule') || 'Create Schedule'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab removed - bookings now in /bookings page */}


      {/* AVAILABILITY TAB */}
      {activeTab === 'availability' && (
        <div className="space-y-6">
          {/* Four cards in a 2x2 grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

            {/* Recurring Card */}
            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="bg-brand/5 border-b border-brand/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock size={20} />
                    <span className="font-semibold">{t('recurringHours')}</span>
                  </div>
                  <button
                    onClick={() => setShowRecurringModal(true)}
                    className="p-1.5 bg-card/20 hover:bg-card/30 rounded-lg text-foreground"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <p className="text-brand/80 text-sm mt-1">{t('recurringDescription')}</p>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                {availabilityBlocks.filter(b => b.schedule_id === currentScheduleId).length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">{t('noRecurring')}</p>
                ) : (
                  <div className="space-y-2">
                    {availabilityBlocks.filter(b => b.schedule_id === currentScheduleId).map(b => (
                      <div key={b.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div>
                          <span className="font-medium text-foreground">{dayNames[b.day_of_week]}</span>
                          <span className="text-foreground/60 text-sm ml-2">{b.start_time} - {b.end_time}</span>
                        </div>
                        <button onClick={() => handleDeleteRecurring(b.id)} className="text-muted-foreground hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Specific Card */}
            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="bg-brand/5 border-b border-brand/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground">
                    <CalendarDays size={20} />
                    <span className="font-semibold">{t('specificDates')}</span>
                  </div>
                  <button
                    onClick={() => setShowSpecificModal(true)}
                    className="p-1.5 bg-card/20 hover:bg-card/30 rounded-lg text-foreground"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <p className="text-brand/80 text-sm mt-1">{t('specificDescription')}</p>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                {specificAvailability.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">{t('noSpecific')}</p>
                ) : (
                  <div className="space-y-2">
                    {specificAvailability.map(sa => (
                      <div key={sa.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium text-foreground">
                            {new Date(sa.start_datetime).toLocaleDateString(locale)}
                          </div>
                          <div className="text-foreground/60">
                            {new Date(sa.start_datetime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} - {new Date(sa.end_datetime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteSpecific(sa.id)} className="text-muted-foreground hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Blocks Card */}
            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-rose-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground">
                    <Ban size={20} />
                    <span className="font-semibold">{t('dateBlocks')}</span>
                  </div>
                  <button
                    onClick={() => setShowBlockModal(true)}
                    className="p-1.5 bg-card/20 hover:bg-card/30 rounded-lg text-foreground"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <p className="text-red-100 text-sm mt-1">{t('blocksDescription')}</p>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                {timeOffs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">{t('noBlocks')}</p>
                ) : (
                  <div className="space-y-2">
                    {timeOffs.map(to => (
                      <div key={to.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium text-foreground">{to.reason || t('dateBlocks')}</div>
                          <div className="text-foreground/60">
                            {new Date(to.start_datetime).toLocaleDateString(locale)} - {new Date(to.end_datetime).toLocaleDateString(locale)}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteBlock(to.id)} className="text-muted-foreground hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Google Calendar Card */}
            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-rose-600 p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Link2 size={20} />
                  <span className="font-semibold">Google Calendar</span>
                </div>
                <p className="text-red-100 text-sm mt-1">
                  Bloquea disponibilidad automáticamente
                </p>
              </div>
              <div className="p-4">
                {!googleConnected ? (
                  <div className="text-center py-4">
                    <p className="text-foreground/60 text-sm mb-3">
                      Conecta Google Calendar en <strong>Configuración</strong> para bloquear
                      automáticamente tu disponibilidad cuando tengas eventos.
                    </p>
                    <a
                      href="/es/settings"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Ir a Configuración →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground/70 mb-3">
                      Los eventos de estos calendarios bloquearán tu disponibilidad:
                    </p>
                    {googleCalendars.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-2">Cargando calendarios...</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {googleCalendars.map((cal) => (
                          <label key={cal.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg cursor-pointer hover:bg-accent">
                            <input
                              type="checkbox"
                              checked={blockingCalendarIds.includes(cal.id)}
                              onChange={(e) => {
                                const newIds = e.target.checked
                                  ? [...blockingCalendarIds, cal.id]
                                  : blockingCalendarIds.filter(id => id !== cal.id);
                                setBlockingCalendarIds(newIds);
                                handleUpdateBlockingCalendars(newIds);
                              }}
                              className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-foreground">
                              {cal.name}{cal.primary ? ' (Principal)' : ''}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calendar Preview */}
          <div className="bg-surface rounded-xl border border-border-subtle p-4">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              views={[Views.WEEK, Views.MONTH]}
              view={currentView}
              onView={setCurrentView}
              date={currentDate}
              onNavigate={setCurrentDate}
              eventPropGetter={eventStyleGetter}
              culture={locale}
              min={new Date(2000, 0, 1, 8, 30, 0)}
              max={new Date(2000, 0, 1, 20, 30, 0)}
            />
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* Recurring Modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">{t('addRecurring')}</h2>
              <button onClick={() => setShowRecurringModal(false)} className="text-muted-foreground hover:text-foreground/70">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddRecurring} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('dayOfWeek')}</label>
                <select
                  value={newRecurring.day_of_week}
                  onChange={e => setNewRecurring({ ...newRecurring, day_of_week: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 text-foreground"
                >
                  {dayNames.map((name, i) => (
                    <option key={i} value={i}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t('startTime')}</label>
                  <input
                    type="time"
                    value={newRecurring.start_time}
                    onChange={e => setNewRecurring({ ...newRecurring, start_time: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t('endTime')}</label>
                  <input
                    type="time"
                    value={newRecurring.end_time}
                    onChange={e => setNewRecurring({ ...newRecurring, end_time: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowRecurringModal(false)} className="px-4 py-2 text-foreground/70 hover:bg-accent rounded-lg">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-brand text-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
                  {saving ? '...' : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Specific Modal */}
      {showSpecificModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">{t('addSpecific')}</h2>
              <button onClick={() => setShowSpecificModal(false)} className="text-muted-foreground hover:text-foreground/70">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSpecific} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('start')}</label>
                <input
                  type="datetime-local"
                  value={newSpecific.start}
                  onChange={e => setNewSpecific({ ...newSpecific, start: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('end')}</label>
                <input
                  type="datetime-local"
                  value={newSpecific.end}
                  onChange={e => setNewSpecific({ ...newSpecific, end: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-foreground"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowSpecificModal(false)} className="px-4 py-2 text-foreground/70 hover:bg-accent rounded-lg">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-purple-600 text-foreground rounded-lg hover:bg-purple-700 disabled:opacity-50">
                  {saving ? '...' : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">{t('addBlock')}</h2>
              <button onClick={() => setShowBlockModal(false)} className="text-muted-foreground hover:text-foreground/70">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddBlock} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('reason')}</label>
                <input
                  type="text"
                  value={newBlock.reason}
                  onChange={e => setNewBlock({ ...newBlock, reason: e.target.value })}
                  placeholder="Navidad, Vacaciones..."
                  className="w-full border rounded-lg px-3 py-2 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('start')}</label>
                <input
                  type="datetime-local"
                  value={newBlock.start}
                  onChange={e => setNewBlock({ ...newBlock, start: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('end')}</label>
                <input
                  type="datetime-local"
                  value={newBlock.end}
                  onChange={e => setNewBlock({ ...newBlock, end: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-foreground"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowBlockModal(false)} className="px-4 py-2 text-foreground/70 hover:bg-accent rounded-lg">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-risk text-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
                  {saving ? '...' : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


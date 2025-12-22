'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { Patient, PatientListResponse } from '@/types/auth';
import { PatientCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState, { PatientsEmptyIcon } from '@/components/ui/EmptyState';
import SectionHeader from '@/components/SectionHeader';
import { Users } from 'lucide-react';
import { useTerminology } from '@/hooks/use-terminology';

// Status options for filter dropdown
const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  // Blocked/Alert
  { value: 'BLOCKED_MEDICAL', label: '⛔ Bloqueado (Médico)' },
  { value: 'BLOCKED_HIGH_RISK', label: '⛔ Riesgo Alto' },
  { value: 'STAGNATION_ALERT', label: '⚠️ Estancado' },
  // Awaiting
  { value: 'AWAITING_PAYMENT', label: '💳 Pago Pendiente' },
  { value: 'AWAITING_SCREENING', label: '📋 Screening' },
  { value: 'AWAITING_BIRTH_DATA', label: '📅 Faltan Datos' },
  { value: 'AWAITING_WAIVER', label: '📝 Waiver Pendiente' },
  // In Progress
  { value: 'PREPARATION_PHASE', label: '🔄 En Preparación' },
  { value: 'ANALYSIS_IN_PROGRESS', label: '🔮 En Análisis' },
  { value: 'ONBOARDING', label: '🚀 Onboarding' },
  { value: 'DEEP_DIVE', label: '🌊 Deep Dive' },
  // Success
  { value: 'ACTIVE_STUDENT', label: '✅ Activo' },
  { value: 'CONFIRMED', label: '✅ Confirmado' },
  { value: 'GRADUATED', label: '🎓 Graduado' },
  { value: 'COMPLETED', label: '🏆 Completado' },
];

export default function PatientsPage() {
  const t = useTranslations('Patients');
  const terminology = useTerminology();
  const pathname = usePathname();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadPatients = useCallback(async (searchTerm = '', status = '') => {
    setLoading(true);
    try {
      const data: PatientListResponse = await api.patients.list(1, searchTerm, status);
      setPatients(data.patients);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load patients', error);
      setPatients([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload patients whenever we navigate to this page
  useEffect(() => {
    loadPatients('', '');
    setSearch(''); // Reset search on page visit
    setStatusFilter(''); // Reset filter on page visit
  }, [pathname, loadPatients]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadPatients(search, statusFilter);
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    loadPatients(search, newStatus);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <SectionHeader
            icon={Users}
            title={terminology.plural}
            subtitle={`Visualiza, busca y gestiona tu cartera de ${terminology.plural.toLowerCase()}. Accede a sus perfiles, estados y datos de contacto.`}
            gradientFrom="from-blue-500"
            gradientTo="to-indigo-500"
            shadowColor="shadow-blue-200"
          />
          <Link
            href="/patients/new"
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-lg shadow-fuchsia-200 font-medium"
          >
            + Añadir {terminology.singular}
          </Link>
        </div>

        {/* Search and Filter */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-slate-900"
            />
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-slate-900 bg-white min-w-[180px]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-lg hover:from-slate-800 hover:to-slate-700 transition-all"
            >
              {t('search')}
            </button>
          </div>
        </form>

        {/* Results */}
        {loading ? (
          // Skeleton loading state
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <PatientCardSkeleton key={i} />
            ))}
          </div>
        ) : patients.length === 0 ? (
          // Empty state
          <EmptyState
            icon={<PatientsEmptyIcon />}
            title={`No hay ${terminology.plural.toLowerCase()}`}
            description={`Empieza añadiendo tu primer ${terminology.singular.toLowerCase()}`}
            action={
              <Link
                href="/patients/new"
                className="inline-flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                + Añadir {terminology.singular}
              </Link>
            }
          />
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">{total} {terminology.plural.toLowerCase()} encontrados</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => {
                // Generate color based on name
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
                const colorIndex = (patient.first_name.charCodeAt(0) + patient.last_name.charCodeAt(0)) % colors.length;
                const initials = `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();

                // Get journey status badge
                const getStatusBadge = () => {
                  if (!patient.journey_status || Object.keys(patient.journey_status).length === 0) {
                    return { label: 'Nuevo', bg: 'bg-slate-100', text: 'text-slate-600' };
                  }

                  // Get the most relevant status
                  const statuses = Object.values(patient.journey_status);
                  const status = statuses[0] as string;

                  // Map status to badge style
                  const statusMap: Record<string, { label: string; bg: string; text: string }> = {
                    // Blocked/Alert states (red)
                    'BLOCKED_MEDICAL': { label: '⛔ Bloqueado', bg: 'bg-red-100', text: 'text-red-700' },
                    'BLOCKED_HIGH_RISK': { label: '⛔ Riesgo Alto', bg: 'bg-red-100', text: 'text-red-700' },
                    'STAGNATION_ALERT': { label: '⚠️ Estancado', bg: 'bg-amber-100', text: 'text-amber-700' },

                    // Awaiting states (yellow/orange)
                    'AWAITING_PAYMENT': { label: '💳 Pago Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-700' },
                    'AWAITING_SCREENING': { label: '📋 Screening', bg: 'bg-orange-100', text: 'text-orange-700' },
                    'AWAITING_BIRTH_DATA': { label: '📅 Faltan Datos', bg: 'bg-orange-100', text: 'text-orange-700' },
                    'AWAITING_WAIVER': { label: '📝 Waiver', bg: 'bg-orange-100', text: 'text-orange-700' },

                    // In Progress states (blue)
                    'PREPARATION_PHASE': { label: '🔄 Preparación', bg: 'bg-blue-100', text: 'text-blue-700' },
                    'ANALYSIS_IN_PROGRESS': { label: '🔮 Análisis', bg: 'bg-indigo-100', text: 'text-indigo-700' },
                    'ONBOARDING': { label: '🚀 Onboarding', bg: 'bg-sky-100', text: 'text-sky-700' },
                    'DEEP_DIVE': { label: '🌊 Deep Dive', bg: 'bg-blue-100', text: 'text-blue-700' },

                    // Success states (green)
                    'ACTIVE_STUDENT': { label: '✅ Activo', bg: 'bg-green-100', text: 'text-green-700' },
                    'CONFIRMED': { label: '✅ Confirmado', bg: 'bg-green-100', text: 'text-green-700' },
                    'READY_FOR_SESSION': { label: '✅ Listo', bg: 'bg-green-100', text: 'text-green-700' },
                    'GRADUATED': { label: '🎓 Graduado', bg: 'bg-emerald-100', text: 'text-emerald-700' },
                    'COMPLETED': { label: '🏆 Completado', bg: 'bg-emerald-100', text: 'text-emerald-700' },
                  };

                  return statusMap[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-600' };
                };

                const badge = getStatusBadge();

                return (
                  <Link
                    key={patient.id}
                    href={`/patients/${patient.id}`}
                    className="block p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      {/* Profile Photo or Initials Avatar */}
                      {patient.profile_image_url ? (
                        <img
                          src={patient.profile_image_url}
                          alt={`${patient.first_name} ${patient.last_name}`}
                          className="w-[72px] h-[72px] rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-xl flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800 truncate">
                            {patient.first_name} {patient.last_name}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.bg} ${badge.text} flex-shrink-0`}>
                            {badge.label}
                          </span>
                        </div>
                        {patient.email && (
                          <p className="text-sm text-slate-500 truncate">{patient.email}</p>
                        )}
                        {patient.phone && (
                          <p className="text-sm text-slate-400">{patient.phone}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


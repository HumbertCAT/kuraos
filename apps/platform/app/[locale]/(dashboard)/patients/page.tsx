'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { Patient, PatientListResponse } from '@/types/auth';
import EmptyState, { PatientsEmptyIcon } from '@/components/ui/EmptyState';
import { Users, Search, MessageCircle, ChevronRight } from 'lucide-react';
import { useTerminology } from '@/hooks/use-terminology';

/**
 * The Clinical Roster - v1.0.9
 * High-density data table for efficient patient management.
 * Replaces the low-density card grid layout.
 */

// Status options for filter dropdown
const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'BLOCKED_MEDICAL', label: '⛔ Bloqueado (Médico)' },
  { value: 'BLOCKED_HIGH_RISK', label: '⛔ Riesgo Alto' },
  { value: 'STAGNATION_ALERT', label: '⚠️ Estancado' },
  { value: 'AWAITING_PAYMENT', label: '💳 Pago Pendiente' },
  { value: 'ACTIVE_STUDENT', label: '✅ Activo' },
  { value: 'CONFIRMED', label: '✅ Confirmado' },
  { value: 'GRADUATED', label: '🎓 Graduado' },
];

// Map status to semantic badge class
function getStatusBadge(patient: Patient): { label: string; className: string } {
  if (!patient.journey_status || Object.keys(patient.journey_status).length === 0) {
    return { label: 'Nuevo', className: 'badge badge-brand' };
  }

  const statuses = Object.values(patient.journey_status);
  const status = statuses[0] as string;

  const statusMap: Record<string, { label: string; className: string }> = {
    // Blocked/Alert (Risk)
    'BLOCKED_MEDICAL': { label: 'Bloqueado', className: 'badge badge-risk' },
    'BLOCKED_HIGH_RISK': { label: 'Alto Riesgo', className: 'badge badge-risk' },
    'STAGNATION_ALERT': { label: 'Estancado', className: 'badge badge-warning' },
    // Awaiting (Warning)
    'AWAITING_PAYMENT': { label: 'Pago Pend.', className: 'badge badge-warning' },
    'AWAITING_SCREENING': { label: 'Screening', className: 'badge badge-muted' },
    // In Progress (AI)
    'PREPARATION_PHASE': { label: 'Preparación', className: 'badge badge-ai' },
    'ANALYSIS_IN_PROGRESS': { label: 'Análisis', className: 'badge badge-ai' },
    'ONBOARDING': { label: 'Onboarding', className: 'badge badge-brand' },
    // Success (Green)
    'ACTIVE_STUDENT': { label: 'Activo', className: 'badge badge-success' },
    'CONFIRMED': { label: 'Confirmado', className: 'badge badge-success' },
    'GRADUATED': { label: 'Graduado', className: 'badge badge-success' },
    'COMPLETED': { label: 'Completado', className: 'badge badge-success' },
  };

  return statusMap[status] || { label: status.replace(/_/g, ' '), className: 'badge badge-muted' };
}

// Health Dot based on journey status (derived from status, not risk score)
function HealthDot({ journeyStatus }: { journeyStatus?: Record<string, string> | null }) {
  // Default to neutral if no status data
  if (!journeyStatus || Object.keys(journeyStatus).length === 0) {
    return (
      <div className="relative group">
        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-popover text-popover-foreground rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Nuevo
        </div>
      </div>
    );
  }

  const status = Object.values(journeyStatus)[0] as string;

  // Map status to health color
  let colorClass = 'bg-success';
  let label = 'Bien';

  if (status?.includes('BLOCKED') || status?.includes('HIGH_RISK')) {
    colorClass = 'bg-risk animate-pulse';
    label = 'Alerta';
  } else if (status?.includes('AWAITING') || status?.includes('STAGNATION') || status?.includes('PAYMENT')) {
    colorClass = 'bg-warning';
    label = 'Pendiente';
  } else if (status?.includes('PREPARATION') || status?.includes('SCREENING')) {
    colorClass = 'bg-ai';
    label = 'En proceso';
  }

  return (
    <div className="relative group">
      <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-popover text-popover-foreground rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {label}
      </div>
    </div>
  );
}

// Table Row Skeleton
function TableRowSkeleton() {
  return (
    <tr className="border-b border-border animate-pulse">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><div className="h-5 w-20 bg-muted rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-4 w-16 bg-muted rounded" /></td>
      <td className="px-4 py-3 text-center"><div className="w-2.5 h-2.5 rounded-full bg-muted mx-auto" /></td>
      <td className="px-4 py-3"><div className="h-8 w-20 bg-muted rounded" /></td>
    </tr>
  );
}

export default function PatientsPage() {
  const t = useTranslations('Patients');
  const terminology = useTerminology();
  const pathname = usePathname();
  const router = useRouter();
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

  useEffect(() => {
    loadPatients('', '');
    setSearch('');
    setStatusFilter('');
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

  function handleRowClick(patientId: string) {
    router.push(`/patients/${patientId}`);
  }

  // Generate avatar initials and color
  function getAvatarProps(patient: Patient) {
    const initials = `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
    const colors = [
      'from-violet-500 to-fuchsia-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-amber-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-purple-500',
    ];
    const colorIndex = (patient.first_name.charCodeAt(0) + patient.last_name.charCodeAt(0)) % colors.length;
    return { initials, gradient: colors[colorIndex] };
  }

  return (
    <div className="space-y-6">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="type-h1">{terminology.plural}</h1>
            <p className="type-body text-muted-foreground">
              Gestiona tu cartera de {terminology.plural.toLowerCase()}
            </p>
          </div>
        </div>
        <Link href="/patients/new" className="btn btn-md btn-brand">
          + Nuevo {terminology.singular}
        </Link>
      </div>

      {/* ========== SEARCH & FILTER BAR ========== */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="px-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-foreground min-w-[180px]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Search Button */}
        <button type="submit" className="btn btn-md btn-primary">
          Buscar
        </button>
      </form>

      {/* ========== RESULTS COUNT ========== */}
      {!loading && patients.length > 0 && (
        <p className="type-body text-muted-foreground">
          {total} {terminology.plural.toLowerCase()} encontrados
        </p>
      )}

      {/* ========== DATA TABLE ========== */}
      {loading ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left type-ui text-muted-foreground">{terminology.singular}</th>
                <th className="px-4 py-3 text-left type-ui text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left type-ui text-muted-foreground hidden md:table-cell">Última Sesión</th>
                <th className="px-4 py-3 text-center type-ui text-muted-foreground hidden sm:table-cell">Salud</th>
                <th className="px-4 py-3 text-right type-ui text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(8)].map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      ) : patients.length === 0 ? (
        <EmptyState
          icon={<PatientsEmptyIcon />}
          title={`No hay ${terminology.plural.toLowerCase()}`}
          description={`Empieza añadiendo tu primer ${terminology.singular.toLowerCase()}`}
          action={
            <Link href="/patients/new" className="btn btn-md btn-brand">
              + Añadir {terminology.singular}
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider">{terminology.singular.toUpperCase()}</th>
                <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider">ESTADO</th>
                <th className="px-4 py-3 text-left type-ui text-muted-foreground tracking-wider hidden md:table-cell">ÚLTIMA SESIÓN</th>
                <th className="px-4 py-3 text-center type-ui text-muted-foreground tracking-wider hidden sm:table-cell">SALUD</th>
                <th className="px-4 py-3 text-right type-ui text-muted-foreground tracking-wider">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => {
                const { initials, gradient } = getAvatarProps(patient);
                const badge = getStatusBadge(patient);

                return (
                  <tr
                    key={patient.id}
                    onClick={() => handleRowClick(patient.id)}
                    className="border-b border-border hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    {/* Patient Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {patient.profile_image_url ? (
                          <img
                            src={patient.profile_image_url}
                            alt={`${patient.first_name} ${patient.last_name}`}
                            className="w-9 h-9 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-semibold`}>
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="type-ui font-medium text-foreground truncate">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {patient.email || patient.phone || 'Sin contacto'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <span className={badge.className}>{badge.label}</span>
                    </td>

                    {/* Last Session */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="type-body text-muted-foreground">
                        Reciente
                      </span>
                    </td>

                    {/* Health Dot */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex justify-center">
                        <HealthDot journeyStatus={patient.journey_status} />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/patients/${patient.id}`}
                          className="btn btn-sm btn-ghost"
                        >
                          Ver
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                        <button className="btn btn-sm btn-ghost p-2">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { Patient, ClinicalEntry, ClinicalEntryListResponse } from '@/types/auth';
import TimelineEntry from '@/components/TimelineEntry';
import Composer from '@/components/Composer';
import SendFormModal from '@/components/SendFormModal';
import JourneyStatusCard from '@/components/JourneyStatusCard';
import AletheiaHUD from '@/components/AletheiaHUD';
import MonitoringTab from '@/components/MonitoringTab';
import SilentErrorBoundary from '@/components/SilentErrorBoundary';
import PatientHero from '@/components/patient/PatientHero';
import SentimentPulseWidget from '@/components/SentimentPulseWidget';
import { usePatientStore } from '@/stores/patient-store';

export default function PatientDetailPage() {
  const t = useTranslations('PatientForm');
  const tJournal = useTranslations('ClinicalJournal');
  const tPatients = useTranslations('Patients');
  const tCommon = useTranslations('Common');
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  // AletheIA Context - activate sidebar for this patient
  const { setActivePatient, clearPatient } = usePatientStore();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [entries, setEntries] = useState<ClinicalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [allPatientIds, setAllPatientIds] = useState<string[]>([]);
  const [patientBookings, setPatientBookings] = useState<any[]>([]);
  const [showSendFormModal, setShowSendFormModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'journal' | 'monitoring'>('journal');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDeleting = useRef(false);  // Guard to pause polling during delete
  const locale = params.locale as string || 'en';

  useEffect(() => {
    loadData();
  }, [patientId]);

  // Trigger AletheIA Observatory when patient data is loaded
  useEffect(() => {
    if (patient) {
      const fullName = `${patient.first_name} ${patient.last_name}`;
      setActivePatient(patientId, fullName);
    }
    // Clear context when leaving page
    return () => {
      clearPatient();
    };
  }, [patient, patientId, setActivePatient, clearPatient]);

  // Polling effect: check for entries with PENDING/PROCESSING status
  useEffect(() => {
    const hasProcessingEntries = entries.some(
      e => e.processing_status === 'PENDING' || e.processing_status === 'PROCESSING'
    );

    if (hasProcessingEntries) {
      // Start polling every 5 seconds
      pollingIntervalRef.current = setInterval(() => {
        // Skip polling if we're in the middle of a delete
        if (isDeleting.current) return;

        api.clinicalEntries.list(patientId).then((data: ClinicalEntryListResponse) => {
          // Only update if not deleting
          if (!isDeleting.current) {
            setEntries(data.entries);
          }
        });
      }, 2000);
    } else {
      // Clear polling when no entries are processing
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [entries, patientId]);

  async function loadData() {
    setLoading(true);
    try {
      const [patientData, entriesData, patientsData, bookingsData] = await Promise.all([
        api.patients.get(patientId),
        api.clinicalEntries.list(patientId),
        api.patients.list(),
        api.bookings.list({ patient_id: patientId }),
      ]);
      setPatient(patientData);
      setEntries(entriesData.entries);
      setAllPatientIds(patientsData.patients.map((p: Patient) => p.id));
      setPatientBookings(bookingsData || []);
    } catch (error) {
      console.error('Failed to load patient data', error);
    } finally {
      setLoading(false);
    }
  }

  // Compute prev/next patient
  const currentIndex = allPatientIds.indexOf(patientId);
  const prevPatientId = currentIndex > 0 ? allPatientIds[currentIndex - 1] : null;
  const nextPatientId = currentIndex < allPatientIds.length - 1 ? allPatientIds[currentIndex + 1] : null;

  const processingCount = entries.filter(
    e => e.processing_status === 'PENDING' || e.processing_status === 'PROCESSING'
  ).length;

  async function handleDeletePatient() {
    if (!confirm(t('confirmDelete'))) return;

    setDeleting(true);
    try {
      await api.patients.delete(patientId);
      router.push('/patients');
    } catch (error) {
      console.error('Failed to delete patient', error);
      setDeleting(false);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm(tJournal('confirmDeleteEntry'))) return;

    // Set guard to prevent polling during delete
    isDeleting.current = true;

    try {
      await api.clinicalEntries.delete(entryId);
      setEntries(prev => prev.filter(e => e.id !== entryId));
    } catch (error) {
      console.error('Failed to delete entry', error);
    } finally {
      // Wait a bit before allowing polling again to let state settle
      setTimeout(() => {
        isDeleting.current = false;
      }, 500);
    }
  }

  function handleEntryCreated() {
    // Reload entries when a new one is created
    api.clinicalEntries.list(patientId).then((data: ClinicalEntryListResponse) => {
      setEntries(data.entries);
    });
  }

  async function handleAnalyzeEntry(entry: ClinicalEntry): Promise<void> {
    // Call backend AletheIA analysis endpoint
    // Backend saves the analysis directly to ai_analyses, so we just refresh
    try {
      await api.clinicalEntries.analyze(entry.id);
      // Refresh entries to show the new analysis
      handleEntryCreated();
    } catch (error: any) {
      console.error('Analysis failed:', error);
      throw new Error(error.message || 'Analysis failed');
    }
  }

  async function handleSaveAnalysis(entryId: string, analysis: string): Promise<void> {
    // Find the entry to get current metadata
    const entry = entries.find(e => e.id === entryId);
    const currentMetadata = entry?.entry_metadata || {};
    const currentAnalyses = currentMetadata.ai_analyses || [];

    // Create new analysis object
    const newAnalysis = {
      id: crypto.randomUUID(),
      text: analysis,
      date: new Date().toISOString(),
    };

    // Append to array
    await api.clinicalEntries.update(entryId, {
      entry_metadata: {
        ...currentMetadata,
        ai_analyses: [...currentAnalyses, newAnalysis],
      },
    });

    // Refresh entries
    handleEntryCreated();
  }

  async function handleDeleteAnalysis(entryId: string, analysisId: string): Promise<void> {
    const entry = entries.find(e => e.id === entryId);
    const currentMetadata = entry?.entry_metadata || {};
    const currentAnalyses = currentMetadata.ai_analyses || [];

    // Remove the analysis with matching id
    const updatedAnalyses = currentAnalyses.filter((a: any) => a.id !== analysisId);

    await api.clinicalEntries.update(entryId, {
      entry_metadata: {
        ...currentMetadata,
        ai_analyses: updatedAnalyses,
      },
    });

    // Refresh entries
    handleEntryCreated();
  }

  async function handleUpdateContent(entryId: string, content: string): Promise<void> {
    await api.clinicalEntries.update(entryId, { content });
    handleEntryCreated();
  }

  async function handleUpdateAnalysis(entryId: string, analysisId: string, newText: string): Promise<void> {
    const entry = entries.find(e => e.id === entryId);
    const currentMetadata = entry?.entry_metadata || {};
    const currentAnalyses = currentMetadata.ai_analyses || [];

    // Update the analysis with matching id
    const updatedAnalyses = currentAnalyses.map((a: any) =>
      a.id === analysisId ? { ...a, text: newText } : a
    );

    await api.clinicalEntries.update(entryId, {
      entry_metadata: {
        ...currentMetadata,
        ai_analyses: updatedAnalyses,
      },
    });

    handleEntryCreated();
  }

  if (loading) {
    return <div className="text-center py-12 text-foreground/60">{tPatients('loading')}</div>;
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground/60 mb-4">{t('notFound')}</p>
        <Link href="/patients" className="text-foreground underline">
          {tPatients('backToPatients')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {processingCount > 0 && (
        <div className="bg-purple-50 border-b border-purple-100 p-2 text-center text-sm text-purple-700 flex items-center justify-center gap-2 transition-all duration-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          <span className="font-medium">{tCommon('aletheiaAnalyzing', { count: processingCount })}</span>
        </div>
      )}
      {/* Header - PatientHero v1.0 */}
      <div className="mb-6">
        {/* Top row: Back + Nav */}
        <div className="flex items-center gap-4 mb-4">
          <Link href="/patients" className="text-sm text-muted-foreground hover:text-foreground">
            ← {tPatients('backToPatients')}
          </Link>
          <div className="flex items-center gap-1 ml-2">
            {prevPatientId ? (
              <Link
                href={`/patients/${prevPatientId}`}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                title="Previous patient"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </Link>
            ) : (
              <span className="p-2 text-muted-foreground cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </span>
            )}
            {nextPatientId ? (
              <Link
                href={`/patients/${nextPatientId}`}
                className="p-2 text-foreground/60 hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                title="Next patient"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ) : (
              <span className="p-2 text-muted-foreground cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </span>
            )}
          </div>
        </div>

        {/* PatientHero Component */}
        <PatientHero
          patient={patient}
          stats={{
            totalSessions: entries.length,
            nextSession: patientBookings.find(b => b.status === 'CONFIRMED')?.start_time
              ? new Date(patientBookings.find(b => b.status === 'CONFIRMED')?.start_time).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
              : undefined,
            engagement: 85, // TODO: Calculate from actual data
          }}
          onSendForm={() => setShowSendFormModal(true)}
        />
      </div>

      {/* AletheIA HUD - Clinical Intelligence Cockpit */}
      <AletheiaHUD
        patientId={patientId}
        patientName={`${patient.first_name} ${patient.last_name}`}
        journeyStatus={patient.journey_status}
        onViewChat={() => setActiveTab('monitoring')}
        onContact={() => {
          if (patient.phone) {
            window.open(`https://wa.me/${patient.phone.replace(/[^0-9]/g, '')}`, '_blank');
          }
        }}
      />

      {/* === PULSE LAYOUT: 2-COLUMN GRID === */}
      {patient.journey_status && Object.keys(patient.journey_status).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* LEFT: Journey (Structure) */}
          <div className="lg:col-span-2">
            <JourneyStatusCard journeyStatus={patient.journey_status} />
          </div>

          {/* RIGHT: Sentiment Pulse (Flow) */}
          <div className="lg:col-span-3">
            <SentimentPulseWidget
              patientId={patientId}
              tier={
                // Demo tier logic: Elena shows PRO upsell, others CENTER
                patient.email === 'elena.art@design.example.com' ? 'PRO' : 'CENTER'
              }
            />
          </div>
        </div>
      )}

      {/* Segmented Tab Navigation */}
      <div className="mb-6">
        <div className="bg-muted/50 p-1 rounded-xl inline-flex gap-1">
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${activeTab === 'journal'
              ? 'bg-card shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            📝 {tCommon('clinicalJournal')}
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${activeTab === 'monitoring'
              ? 'bg-card shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            📊 {tCommon('monitoring')}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {
        activeTab === 'monitoring' ? (
          <MonitoringTab patientId={patientId} />
        ) : (
          <>
            {/* Bookings Section */}
            {patientBookings.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">{tCommon('bookings')} ({patientBookings.length})</h2>
                <div className="grid gap-3">
                  {patientBookings.map(booking => (
                    <div key={booking.id} className="bg-card border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-foreground">{booking.service_title}</p>
                        <p className="text-sm text-foreground/60">
                          {new Date(booking.start_time).toLocaleDateString(locale, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${booking.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-secondary text-secondary-foreground'
                          }`}>
                          {booking.status}
                        </span>
                        <p className="text-sm text-foreground/60 mt-1">{booking.amount_paid} {booking.currency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Composer */}
            <SilentErrorBoundary>
              <Composer patientId={patientId} onEntryCreated={handleEntryCreated} />
            </SilentErrorBoundary>

            {/* Timeline */}
            <h2 className="text-lg font-semibold text-foreground mb-4">{tJournal('timeline')}</h2>

            {entries.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <p className="text-foreground/60">{tJournal('noEntries')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <TimelineEntry
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDeleteEntry}
                    onUpdateContent={handleUpdateContent}
                    onAnalyze={handleAnalyzeEntry}
                    onSaveAnalysis={handleSaveAnalysis}
                    onUpdateAnalysis={handleUpdateAnalysis}
                    onDeleteAnalysis={handleDeleteAnalysis}
                  />
                ))}
              </div>
            )}

            {/* Send Form Modal */}
            <SendFormModal
              patientId={patientId}
              patientName={`${patient.first_name} ${patient.last_name}`}
              patientEmail={patient.email || undefined}
              patientPhone={patient.phone || undefined}
              isOpen={showSendFormModal}
              onClose={() => setShowSendFormModal(false)}
              locale={locale}
            />
          </>
        )
      }
    </div >
  );
}


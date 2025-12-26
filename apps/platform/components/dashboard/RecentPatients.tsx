'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { FolderOpen, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useTerminology } from '@/hooks/use-terminology';

const STORAGE_KEY = 'kura-recent-patients';

interface Patient {
    id: string;
    first_name: string;
    last_name: string;
}

export function RecentPatients() {
    const terminology = useTerminology();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRecentPatients() {
            try {
                // First try to get from localStorage
                const storedIds = localStorage.getItem(STORAGE_KEY);
                const recentIds: string[] = storedIds ? JSON.parse(storedIds) : [];

                if (recentIds.length > 0) {
                    // Fetch patient details for stored IDs
                    const result = await api.patients.list();
                    const allPatients = result.patients || [];

                    // Filter and order by recent IDs
                    const recentPatients = recentIds
                        .map(id => allPatients.find((p: Patient) => p.id === id))
                        .filter(Boolean)
                        .slice(0, 3) as Patient[];

                    if (recentPatients.length > 0) {
                        setPatients(recentPatients);
                        setLoading(false);
                        return;
                    }
                }

                // Fallback: get first 3 patients from API
                const result = await api.patients.list();
                const allPatients = result.patients || [];
                setPatients(allPatients.slice(0, 3));
            } catch (err) {
                console.error('Failed to load recent patients:', err);
            } finally {
                setLoading(false);
            }
        }
        loadRecentPatients();
    }, []);

    return (
        <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-blue-500" />
                    <span className="type-h2 text-xs">{terminology.plural} Recientes</span>
                </div>
                <Link href="/patients" className="text-xs text-brand hover:underline">
                    Ver todos
                </Link>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
                    ))}
                </div>
            ) : patients.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                    Sin {terminology.plural.toLowerCase()} recientes
                </p>
            ) : (
                <div className="space-y-1">
                    {patients.map(p => (
                        <Link
                            key={p.id}
                            href={`/patients/${p.id}`}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors group"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-medium">
                                    {p.first_name[0]}{p.last_name[0]}
                                </div>
                                <span className="text-sm text-foreground">
                                    {p.first_name} {p.last_name}
                                </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

// Utility to save a patient visit to localStorage (call this when viewing a patient)
export function recordPatientVisit(patientId: string) {
    const storedIds = localStorage.getItem(STORAGE_KEY);
    const recentIds: string[] = storedIds ? JSON.parse(storedIds) : [];

    // Remove if exists, add to front
    const filtered = recentIds.filter(id => id !== patientId);
    const updated = [patientId, ...filtered].slice(0, 10);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

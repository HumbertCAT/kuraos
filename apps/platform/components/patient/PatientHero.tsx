'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Mail, Phone, MessageCircle, Edit, Calendar, Activity, TrendingUp } from 'lucide-react';
import { getButtonClasses } from '@/components/ui/CyberButton';
import PrivacyTierBadge from '@/components/patient/PrivacyTierBadge';

/**
 * PatientHero v1.0 - "The Clinical Canvas"
 * 
 * Premium profile header with:
 * - Large avatar with ring glow
 * - Member Since date
 * - Quick Stats Row
 * - Tactile Action Buttons
 */

interface PatientHeroProps {
    patient: {
        id: string;
        first_name: string;
        last_name: string;
        email?: string | null;
        phone?: string | null;
        profile_image_url?: string | null;
        created_at?: string;
        privacy_tier_override?: 'GHOST' | 'STANDARD' | 'LEGACY' | null;
    };
    orgDefaultTier?: 'GHOST' | 'STANDARD' | 'LEGACY';
    stats?: {
        totalSessions: number;
        nextSession?: string;
        engagement: number;
    };
    onContact?: () => void;
    onSendForm?: () => void;
    onPrivacyChange?: (patientId: string, tier: 'GHOST' | 'STANDARD') => Promise<void>;
}

export default function PatientHero({ patient, orgDefaultTier, stats, onContact, onSendForm, onPrivacyChange }: PatientHeroProps) {
    const initials = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`;
    const fullName = `${patient.first_name} ${patient.last_name}`;

    // Calculate "Member Since"
    const memberSince = patient.created_at
        ? new Date(patient.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        : null;

    return (
        <div className="card p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Large Avatar */}
                <div className="flex-shrink-0">
                    {patient.profile_image_url ? (
                        <img
                            src={patient.profile_image_url}
                            alt={fullName}
                            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-brand/20 shadow-lg"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand to-brand/60 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-brand/20 shadow-lg">
                            {initials}
                        </div>
                    )}
                </div>

                {/* Info Column */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <h1 className="type-h1 text-foreground truncate">{fullName}</h1>
                        {/* v1.5.6: Privacy Tier Selector */}
                        <div className="hidden sm:block">
                            <PrivacyTierBadge
                                patientId={patient.id}
                                currentTier={patient.privacy_tier_override || orgDefaultTier || 'STANDARD'}
                                onTierChange={onPrivacyChange ? (tier) => onPrivacyChange(patient.id, tier) : undefined}
                            />
                        </div>
                    </div>
                    {memberSince && (
                        <p className="type-body text-muted-foreground mt-1">
                            Cliente desde {memberSince}
                        </p>
                    )}

                    {/* Quick Stats Row */}
                    <div className="flex flex-wrap gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-brand" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Sesiones</p>
                                <p className="type-ui font-semibold text-foreground">{stats?.totalSessions ?? '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-ai/10 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-ai" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Próxima</p>
                                <p className="type-ui font-semibold text-foreground">{stats?.nextSession ?? '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-success" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Engagement</p>
                                <p className="type-ui font-semibold text-foreground">{stats?.engagement ?? 0}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap gap-2 sm:flex-col lg:flex-row">
                    <Link
                        href={`/patients/${patient.id}/edit`}
                        className={getButtonClasses({ variant: 'outline', size: 'sm' })}
                    >
                        <Edit className="w-4 h-4" />
                        Editar
                    </Link>
                    {patient.email && (
                        <a
                            href={`mailto:${patient.email}`}
                            className={getButtonClasses({ variant: 'ghost', size: 'sm' })}
                        >
                            <Mail className="w-4 h-4" />
                            Email
                        </a>
                    )}
                    {patient.phone && (
                        <a
                            href={`https://wa.me/${patient.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={getButtonClasses({ variant: 'highlight', size: 'sm' })}
                            onClick={onContact}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Contactar
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

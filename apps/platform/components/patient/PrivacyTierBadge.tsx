'use client';

import { useState } from 'react';
import { Ghost, Shield, ChevronDown } from 'lucide-react';

interface PrivacyTierBadgeProps {
    currentTier?: 'GHOST' | 'STANDARD' | 'LEGACY';
    patientId: string;
    onTierChange?: (tier: 'GHOST' | 'STANDARD') => Promise<void>;
    disabled?: boolean;
}

/**
 * Privacy Tier Selector Badge
 * 
 * v1.5.6: Visual control for Ghost Protocol
 * Displays current privacy tier with dropdown to change.
 */
export default function PrivacyTierBadge({
    currentTier = 'STANDARD',
    patientId,
    onTierChange,
    disabled = false,
}: PrivacyTierBadgeProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const isGhost = currentTier === 'GHOST';

    const handleSelect = async (tier: 'GHOST' | 'STANDARD') => {
        if (tier === currentTier || !onTierChange) return;

        setLoading(true);
        try {
            await onTierChange(tier);
        } finally {
            setLoading(false);
            setIsOpen(false);
        }
    };

    const tierConfig = {
        GHOST: {
            label: 'Ghost',
            icon: Ghost,
            bg: 'bg-indigo-500/10 hover:bg-indigo-500/20',
            border: 'border-indigo-500/30',
            text: 'text-indigo-400',
            description: 'RAM-only. No persistent data.',
        },
        STANDARD: {
            label: 'Standard',
            icon: Shield,
            bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
            border: 'border-emerald-500/30',
            text: 'text-emerald-400',
            description: 'Audio deleted. Text preserved.',
        },
        LEGACY: {
            label: 'Legacy',
            icon: Shield,
            bg: 'bg-amber-500/10 hover:bg-amber-500/20',
            border: 'border-amber-500/30',
            text: 'text-amber-400',
            description: 'Full data retention.',
        },
    };

    const current = tierConfig[currentTier] || tierConfig.STANDARD;
    const CurrentIcon = current.icon;

    if (!onTierChange) {
        // Read-only badge
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${current.bg} ${current.border} ${current.text}`}>
                <CurrentIcon className="w-3.5 h-3.5" />
                {current.label}
            </span>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled || loading}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${current.bg} ${current.border} ${current.text} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <CurrentIcon className="w-3.5 h-3.5" />
                )}
                {current.label}
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-1 z-20 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                        {(['STANDARD', 'GHOST'] as const).map((tier) => {
                            const config = tierConfig[tier];
                            const Icon = config.icon;
                            const isSelected = tier === currentTier;

                            return (
                                <button
                                    key={tier}
                                    onClick={() => handleSelect(tier)}
                                    disabled={isSelected}
                                    className={`w-full px-3 py-2 text-left flex items-start gap-2 transition-colors cursor-pointer ${isSelected ? 'bg-muted/50' : 'hover:bg-muted'}`}
                                >
                                    <Icon className={`w-4 h-4 mt-0.5 ${config.text}`} />
                                    <div>
                                        <div className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                                            {config.label}
                                            {isSelected && <span className="ml-1 text-xs text-foreground/50">✓</span>}
                                        </div>
                                        <div className="text-xs text-foreground/50">{config.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

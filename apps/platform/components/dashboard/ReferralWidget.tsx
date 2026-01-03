'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { Sparkles, Copy, MessageCircle, Check } from 'lucide-react';
import { getButtonClasses } from '@/components/ui/CyberButton';

/**
 * ReferralWidget - The Mycelium Protocol
 * 
 * Displays user's referral code and karma score.
 * Enables viral growth through easy sharing.
 * 
 * @since v1.1.18 - The Mycelium
 */
export function ReferralWidget() {
    const { organization } = useAuth();
    const locale = useLocale();
    const t = useTranslations('Dashboard.referralWidget');
    const [copied, setCopied] = useState(false);

    if (!organization) return null;

    const referralUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}/register?ref=${organization.referral_code}`;
    const whatsappText = encodeURIComponent(
        t('whatsappMessage', {
            code: organization.referral_code,
            url: referralUrl
        })
    );

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(referralUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="bg-card border border-brand/20 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-warning" />
                    <h3 className="type-ui text-foreground">{t('title')}</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-warning/10 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5 text-warning" />
                    <span className="text-sm font-mono font-semibold text-warning">{organization.karma_score}</span>
                </div>
            </div>

            {/* Message */}
            <p className="text-sm text-muted-foreground mb-4">
                {t('tagline')}
            </p>

            {/* Referral Code Display */}
            <div className="bg-muted/50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t('yourCode')}</p>
                        <p className="font-mono text-sm font-bold text-brand">{organization.referral_code}</p>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="p-2 hover:bg-muted rounded-lg transition-colors active:scale-95"
                        title={t('copyLink')}
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-success" />
                        ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                    </button>
                </div>
            </div>

            {/* WhatsApp Share Button */}
            <a
                href={`https://wa.me/?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className={getButtonClasses({ variant: 'highlight', className: 'w-full' })}
            >
                <MessageCircle className="w-4 h-4" />
                {t('shareWhatsApp')}
            </a>
        </div>
    );
}

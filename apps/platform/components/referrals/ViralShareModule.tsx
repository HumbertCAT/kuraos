'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Copy, Share2, Mail, MessageCircle, Linkedin, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface ViralShareModuleProps {
    referralCode: string;
}

/**
 * ViralShareModule - Zone B of the Growth Station
 * 
 * Expanded share tools with multiple channels.
 * @since v1.1.18 - The Mycelium
 */
export function ViralShareModule({ referralCode }: ViralShareModuleProps) {
    const t = useTranslations('Settings.referrals');
    const locale = useLocale();
    const [copied, setCopied] = useState(false);

    const referralUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://app.kuraos.ai'}/${locale}/register?ref=${referralCode}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const whatsappText = encodeURIComponent(
        t('whatsappMessage', { code: referralCode, url: referralUrl })
    );
    const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

    const emailSubject = encodeURIComponent(t('emailSubject'));
    const emailBody = encodeURIComponent(
        t('emailBody', { code: referralCode, url: referralUrl })
    );
    const emailUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;

    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;

    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-brand" />
                {t('shareTitle')}
            </h3>

            {/* Referral Code Display */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <p className="text-xs text-muted-foreground mb-1">{t('yourCode')}</p>
                <p className="text-2xl font-mono font-bold text-foreground tracking-wider">{referralCode}</p>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                    onClick={handleCopy}
                    className="flex flex-col items-center gap-2 p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-all active:scale-95"
                >
                    {copied ? (
                        <Check className="w-6 h-6 text-success" />
                    ) : (
                        <Copy className="w-6 h-6 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">
                        {copied ? t('copied') : t('copyLink')}
                    </span>
                </button>

                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 bg-success/10 hover:bg-success/20 rounded-lg transition-all active:scale-95"
                >
                    <MessageCircle className="w-6 h-6 text-success" />
                    <span className="text-xs text-success">WhatsApp</span>
                </a>

                <a
                    href={emailUrl}
                    className="flex flex-col items-center gap-2 p-4 bg-brand/10 hover:bg-brand/20 rounded-lg transition-all active:scale-95"
                >
                    <Mail className="w-6 h-6 text-brand" />
                    <span className="text-xs text-brand">Email</span>
                </a>

                <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 bg-brand/10 hover:bg-brand/20 rounded-lg transition-all active:scale-95"
                >
                    <Linkedin className="w-6 h-6 text-brand" />
                    <span className="text-xs text-brand">LinkedIn</span>
                </a>
            </div>

            {/* Public URL */}
            <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground truncate font-mono">{referralUrl}</p>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
        </div>
    );
}

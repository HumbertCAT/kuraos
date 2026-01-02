'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';

interface PoweredByKuraFooterProps {
    organizationTier?: 'BUILDER' | 'PRO' | 'CENTER';
}

/**
 * PoweredByKuraFooter - The Viral Loop
 * 
 * Discreet footer for public pages (booking, forms) with link to registration.
 * Prepared for tier-gating (currently shows for all tiers).
 * 
 * @since v1.1.18 - The Mycelium (Part 2)
 */
export function PoweredByKuraFooter({
    organizationTier = 'BUILDER'
}: PoweredByKuraFooterProps) {
    const locale = useLocale();
    const t = useTranslations('Public');

    // Future: hide for PRO and CENTER
    // const shouldShow = organizationTier === 'BUILDER';
    const shouldShow = true; // Show for all tiers (v1.1.18)

    if (!shouldShow) return null;

    return (
        <div className="mt-12 text-center text-xs text-muted-foreground">
            <p>
                {t('securePayment')}{' '}
                <a
                    href={`https://kuraos.ai/${locale}/register?ref=PUBLIC`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors underline decoration-dotted underline-offset-2"
                    aria-label={t('poweredByAriaLabel')}
                >
                    {t('poweredBy')}
                    <ExternalLink className="w-3 h-3" />
                </a>
            </p>
        </div>
    );
}

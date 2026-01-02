'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Sparkles, Copy, MessageCircle, Check } from 'lucide-react';

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
    const [copied, setCopied] = useState(false);

    if (!organization) return null;

    const referralUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/es/register?ref=${organization.referral_code}`;
    const whatsappText = encodeURIComponent(
        `🚀 Descubre KURA OS - La plataforma que uso para gestionar mi práctica terapéutica.\n\nÚsala con mi código: ${organization.referral_code}\n${referralUrl}`
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
                    <h3 className="type-ui text-foreground">El Micelio</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-warning/10 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5 text-warning" />
                    <span className="text-sm font-mono font-semibold text-warning">{organization.karma_score}</span>
                </div>
            </div>

            {/* Message */}
            <p className="text-sm text-muted-foreground mb-4">
                Invita a un colega. Gana Karma. Construyamos la red.
            </p>

            {/* Referral Code Display */}
            <div className="bg-muted/50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tu código</p>
                        <p className="font-mono text-sm font-bold text-brand">{organization.referral_code}</p>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="p-2 hover:bg-muted rounded-lg transition-colors active:scale-95"
                        title="Copiar enlace"
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
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-brand/10 hover:bg-brand/20 text-brand rounded-lg transition-all active:scale-95 text-sm font-medium"
            >
                <MessageCircle className="w-4 h-4" />
                Compartir vía WhatsApp
            </a>
        </div>
    );
}

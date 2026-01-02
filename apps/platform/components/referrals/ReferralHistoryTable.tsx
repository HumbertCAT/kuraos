'use client';

import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Users, Calendar, Sparkles } from 'lucide-react';

interface ReferredOrg {
    id: string;
    name: string;
    joined_at: string;
    status: string;
    karma_earned: number;
}

interface ReferralHistoryTableProps {
    history: ReferredOrg[];
    totalReferred: number;
    totalActive: number;
}

/**
 * ReferralHistoryTable - Part of Zone C of the Growth Station
 * 
 * High-density roster showing who signed up with user's referral code.
 * @since v1.1.18 - The Mycelium
 */
export function ReferralHistoryTable({ history, totalReferred, totalActive }: ReferralHistoryTableProps) {
    const t = useTranslations('Settings.referrals');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand" />
                    {t('historyTitle')}
                </h3>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                        {t('totalReferred')}: <span className="font-mono font-bold text-foreground">{totalReferred}</span>
                    </span>
                    <span className="text-muted-foreground">
                        {t('activeReferrals')}: <span className="font-mono font-bold text-success">{totalActive}</span>
                    </span>
                </div>
            </div>

            {history.length === 0 ? (
                <div className="bg-muted/30 rounded-xl p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('noReferrals')}</p>
                    <p className="text-sm text-muted-foreground/70 mt-2">{t('startSharing')}</p>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="border-b border-border bg-muted/30">
                            <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                                <th className="text-left py-3 px-4 font-medium">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        Date
                                    </span>
                                </th>
                                <th className="text-left py-3 px-4 font-medium">Organization</th>
                                <th className="text-center py-3 px-4 font-medium">Status</th>
                                <th className="text-right py-3 px-4 font-medium">
                                    <span className="flex items-center gap-1 justify-end">
                                        <Sparkles className="w-3 h-3" />
                                        Karma
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((ref, idx) => (
                                <tr
                                    key={ref.id}
                                    className={`
                    border-b border-border/50 hover:bg-muted/30 transition-colors
                    ${idx === history.length - 1 ? 'border-b-0' : ''}
                  `}
                                >
                                    <td className="py-4 px-4 text-sm font-mono text-muted-foreground">
                                        {format(new Date(ref.joined_at), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="font-medium text-foreground">{ref.name}</span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`
                      inline-flex px-2 py-1 rounded-full text-xs font-medium
                      ${ref.status === 'ACTIVE'
                                                ? 'bg-success/10 text-success'
                                                : 'bg-warning/10 text-warning'
                                            }
                    `}>
                                            {ref.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className="font-mono font-bold text-warning">+{ref.karma_earned}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

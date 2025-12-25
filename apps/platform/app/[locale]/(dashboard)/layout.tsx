'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { useTerminology } from '@/hooks/use-terminology';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChevronDown, LogOut, Settings, Sparkles } from 'lucide-react';
import PlanUsageWidget from '@/components/PlanUsageWidget';
import HelpChatBot from '@/components/help/HelpChatBot';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('Navigation');
  const tAuth = useTranslations('Auth');
  const { user, logout } = useAuth();
  const terminology = useTerminology();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/patients', label: terminology.plural },
    { href: '/leads', label: 'CRM' },
    { href: '/bookings', label: t('bookings') || 'Reservas' },
    { href: '/calendar', label: t('calendar') },
    { href: '/services', label: t('services') },
    { href: '/automations', label: t('automations') || 'Automatizaciones' },
    { href: '/forms', label: t('forms') },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Glass Header - Sticky with blur */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-border-subtle px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo - Light/Dark variants */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <img
              src="/kura-logo-light.png"
              alt="KURA OS"
              className="h-20 w-auto dark:hidden"
            />
            <img
              src="/kura-logo-dark.png"
              alt="KURA OS"
              className="h-20 w-auto hidden dark:block"
            />
          </Link>

          {/* Main Menu */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-[15px] font-medium rounded-lg transition-all ${isActive
                    ? 'bg-brand/10 text-brand dark:bg-brand/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />

            {/* User Dropdown */}
            {user && (
              <div
                className="relative"
                onMouseEnter={() => setShowUserMenu(true)}
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline">{user.full_name?.split(' ')[0]}</span>
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-surface border border-border-subtle rounded-xl shadow-xl dark:shadow-none z-50 overflow-hidden">
                    {/* User Info */}
                    <div className="p-4 bg-gradient-to-r from-teal-50 to-teal-100/50 dark:from-teal-950/50 dark:to-teal-900/30">
                      <p className="font-semibold text-zinc-800 dark:text-zinc-100">{user.full_name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                    </div>

                    {/* Mi Plan with Usage Bars */}
                    <div className="p-3 border-b border-border-subtle">
                      <Link
                        href="/settings/plan"
                        className="flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg p-2 -m-2 transition-colors"
                      >
                        <Sparkles className="w-5 h-5 text-brand mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings') === 'Settings' ? 'My Plan' : 'Mi Plan'}</p>
                          <PlanUsageWidget compact />
                        </div>
                      </Link>
                    </div>

                    {/* Settings + Logout Row */}
                    <div className="p-2 flex items-center gap-2">
                      <Link
                        href="/settings"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        {t('settings')}
                      </Link>
                      <button
                        onClick={logout}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-risk hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {tAuth('logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Stage */}
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>

      {/* Global Help ChatBot */}
      <HelpChatBot />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { useTerminology } from '@/hooks/use-terminology';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ChevronDown, LogOut, Settings, Sparkles, Bot } from 'lucide-react';
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
    { href: '/patients', label: terminology.plural }, // Dynamic: Pacientes/Clientes/Consultantes
    { href: '/leads', label: 'CRM' },
    { href: '/bookings', label: t('bookings') || 'Reservas' },
    { href: '/calendar', label: t('calendar') },
    { href: '/services', label: t('services') },
    { href: '/automations', label: t('automations') || 'Automatizaciones' },
    { href: '/forms', label: t('forms') },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <img
              src="/kura-logo-full.png"
              alt="KURA OS"
              className="h-24 w-auto"
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
                    ? 'bg-gradient-to-r from-violet-50 to-fuchsia-50 text-fuchsia-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>


          {/* Right section */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            {/* User Dropdown */}
            {user && (
              <div
                className="relative"
                onMouseEnter={() => setShowUserMenu(true)}
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline">{user.full_name?.split(' ')[0]}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* User Info */}
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50">
                      <p className="font-semibold text-slate-800">{user.full_name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>

                    {/* Mi Plan with Usage Bars */}
                    <div className="p-3 border-b border-slate-100">
                      <Link
                        href="/settings/plan"
                        className="flex items-start gap-3 hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors"
                      >
                        <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">{t('settings') === 'Settings' ? 'My Plan' : 'Mi Plan'}</p>
                          <PlanUsageWidget compact />
                        </div>
                      </Link>
                    </div>

                    {/* Settings + Logout Row */}
                    <div className="p-2 flex items-center gap-2">
                      <Link
                        href="/settings"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        {t('settings')}
                      </Link>
                      <button
                        onClick={logout}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>

      {/* Global Help ChatBot - visible on all dashboard pages */}
      <HelpChatBot />
    </div>
  );
}

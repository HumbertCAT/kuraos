'use client';

import { TrinityNav } from '@/components/layout/TrinityNav';
import { MobileNavBar } from '@/components/layout/MobileNavBar';
import HelpChatBot from '@/components/help/HelpChatBot';
import AletheiaObservatory from '@/components/AletheiaObservatory';
import { ThemeHydration } from '@/components/theme/ThemeHydration';
import { GlobalCommandPalette } from '@/components/command/GlobalCommandPalette';
import { useAuth } from '@/context/auth-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organization, globalTheme } = useAuth();

  // Priority: org theme > global theme > CSS defaults
  const effectiveTheme = organization?.theme_config || globalTheme;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* Theme Hydration: Inject saved CSS variables from DB */}
      <ThemeHydration themeConfig={effectiveTheme} />

      {/* Global Command Palette (⌘K) */}
      <GlobalCommandPalette />

      {/* COL 1: Trinity Navigation (Fixed Sidebar - Hidden on mobile) */}
      <TrinityNav />

      {/* COL 2: Main Stage (Fluid) */}
      <main
        className="flex-1 overflow-y-auto relative bg-background"
        style={{ boxShadow: 'var(--shadow-diffuse)' }}
      >
        <div className="max-w-6xl mx-auto p-6 pb-24 lg:pb-6">
          {children}
        </div>
      </main>

      {/* COL 3: AletheIA Observatory (Desktop only, XL screens) */}
      <AletheiaObservatory />

      {/* Mobile Bottom Navigation (Mobile only) */}
      <MobileNavBar />

      {/* Global Help ChatBot */}
      <HelpChatBot />
    </div>
  );
}

'use client';

import { TrinityNav } from '@/components/layout/TrinityNav';
import HelpChatBot from '@/components/help/HelpChatBot';
import { BrainCircuit } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* COL 1: Trinity Navigation (Fixed Sidebar) */}
      <TrinityNav />

      {/* COL 2: Main Stage (Fluid) */}
      <main className="flex-1 overflow-y-auto relative bg-background">
        <div className="max-w-6xl mx-auto p-6 pb-20 lg:pb-6">
          {children}
        </div>
      </main>

      {/* COL 3: Intelligence Rail (Desktop only, XL screens) */}
      <aside className="hidden xl:flex w-80 flex-col border-l border-border-subtle bg-surface/50 p-4">
        <div className="flex items-center gap-2 text-ai mb-4">
          <BrainCircuit className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">AletheIA Observatory</span>
        </div>
        <div className="flex-1 rounded-lg border border-dashed border-border-subtle flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">
          AI Context Window Active
        </div>
      </aside>

      {/* Global Help ChatBot */}
      <HelpChatBot />
    </div>
  );
}

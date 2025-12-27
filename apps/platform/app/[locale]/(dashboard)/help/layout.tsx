import { HelpSidebar } from '@/components/help/HelpSidebar';

interface HelpLayoutProps {
    children: React.ReactNode;
}

/**
 * DocsLayout for Help Center
 * 
 * Left sidebar with navigation, main content area on the right.
 * Uses flex layout for proper sidebar behavior.
 */
export default function HelpLayout({ children }: HelpLayoutProps) {
    return (
        <div className="flex h-[calc(100vh-4rem)] -m-6 -mt-4">
            {/* Sidebar */}
            <HelpSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}

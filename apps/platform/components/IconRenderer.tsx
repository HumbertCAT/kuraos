'use client';

import {
    // Core automation icons
    ShieldAlert,
    Banknote,
    HeartHandshake,
    Zap,
    // Common action icons
    Mail,
    MessageSquare,
    Bell,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    // Status icons
    Play,
    Pause,
    Power,
    // UI icons
    Settings,
    Sparkles,
    type LucideProps,
} from 'lucide-react';
import { ComponentType } from 'react';

/**
 * Icon registry - only includes icons we actually use.
 * Add new icons here as needed (much faster than importing all ~1000).
 */
const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
    // Playbook icons (from seed data)
    ShieldAlert,
    Banknote,
    HeartHandshake,
    Zap,
    // Email/notification
    Mail,
    MessageSquare,
    Bell,
    // Status/timing
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    // Control
    Play,
    Pause,
    Power,
    // UI
    Settings,
    Sparkles,
};

interface IconRendererProps extends LucideProps {
    name: string;
}

/**
 * Renders a Lucide icon by name from a pre-defined registry.
 * Much faster than `import * as LucideIcons` (avoids bundling ~1000 icons).
 * 
 * @param name - Icon name (e.g., "ShieldAlert", "Banknote")
 * @param props - Lucide icon props (className, size, etc.)
 */
export default function IconRenderer({ name, ...props }: IconRendererProps) {
    const IconComponent = ICON_MAP[name] || Zap;
    return <IconComponent {...props} />;
}

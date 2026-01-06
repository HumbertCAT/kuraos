'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { TiersTab } from '../components/TiersTab';

interface SystemSetting {
    key: string;
    value: any;
    description: string | null;
}

/**
 * Tiers section page
 */
export default function TiersPage() {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const settingsData = await api.admin.listSettings();
            setSettings(settingsData);
        } catch (err) {
            console.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="animate-pulse bg-muted/50 h-64 rounded-xl" />;
    }

    return <TiersTab settings={settings} onSettingsChange={loadSettings} />;
}

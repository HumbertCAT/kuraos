/**
 * Patient Store (Zustand)
 * 
 * Manages active patient state for AletheIA Observatory.
 * Supports two modes:
 * - Patient Mode: Shows individual patient insights
 * - Global Mode: Shows clinic-wide alerts and pending actions
 */

import { create } from 'zustand';
import { getPatientInsights, AletheiaUIData } from '@/lib/api/aletheia';

// Global insights for clinic-wide monitoring
export type GlobalAlert = {
  id: string;
  patientId: string;
  patientName: string;
  riskLevel: 'HIGH' | 'MEDIUM';
  reason: string;
};

export type GlobalInsights = {
  highRiskCount: number;
  pendingActionsCount: number;
  activeAlerts: GlobalAlert[];
  lastBriefingAt: string | null;
};

type PatientState = {
  // Patient Mode State
  activePatientId: string | null;
  patientName: string | null;
  insights: AletheiaUIData | null;
  isLoading: boolean;
  error: string | null;

  // Global Mode State
  globalInsights: GlobalInsights | null;
  isLoadingGlobal: boolean;

  // Actions - Patient Mode
  setActivePatient: (id: string, name: string) => void;
  fetchInsights: () => Promise<void>;
  refreshInsights: () => Promise<void>;
  clearPatient: () => void;

  // Actions - Global Mode
  fetchGlobalInsights: () => Promise<void>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';

export const usePatientStore = create<PatientState>((set, get) => ({
  // Patient Mode Initial State
  activePatientId: null,
  patientName: null,
  insights: null,
  isLoading: false,
  error: null,

  // Global Mode Initial State
  globalInsights: null,
  isLoadingGlobal: false,

  // ============ Patient Mode Actions ============
  setActivePatient: (id, name) => {
    set({ 
      activePatientId: id, 
      patientName: name,
      insights: null, 
      error: null 
    });
    // Auto-fetch when patient changes
    get().fetchInsights();
  },

  fetchInsights: async () => {
    const { activePatientId } = get();
    if (!activePatientId) return;

    set({ isLoading: true, error: null });

    try {
      const data = await getPatientInsights(activePatientId);
      if (data) {
        set({ insights: data, isLoading: false });
      } else {
        set({ 
          insights: null, 
          isLoading: false,
          error: 'No insights available'
        });
      }
    } catch (err) {
      set({ 
        error: 'Failed to load AletheIA insights', 
        isLoading: false 
      });
    }
  },

  refreshInsights: async () => {
    const { activePatientId } = get();
    if (!activePatientId) return;

    set({ isLoading: true, error: null });

    try {
      const data = await getPatientInsights(activePatientId, true);
      if (data) {
        set({ insights: data, isLoading: false });
      }
    } catch (err) {
      set({ 
        error: 'Failed to refresh insights', 
        isLoading: false 
      });
    }
  },

  clearPatient: () => set({ 
    activePatientId: null, 
    patientName: null,
    insights: null,
    error: null 
  }),

  // ============ Global Mode Actions ============
  fetchGlobalInsights: async () => {
    set({ isLoadingGlobal: true });

    try {
      // Fetch high-risk patients
      const riskResponse = await fetch(`${API_URL}/patients?high_risk=true`, {
        credentials: 'include',
      });

      // Fetch pending actions count
      const actionsResponse = await fetch(`${API_URL}/pending-actions?status=PENDING`, {
        credentials: 'include',
      });

      let highRiskPatients: GlobalAlert[] = [];
      let pendingActionsCount = 0;

      if (riskResponse.ok) {
        const riskData = await riskResponse.json();
        highRiskPatients = (riskData.patients || [])
          .filter((p: any) => {
            const level = (p.risk_level || '').toUpperCase();
            return level === 'HIGH' || level === 'MEDIUM';
          })
          .slice(0, 5)
          .map((p: any) => ({
            id: p.id,
            patientId: p.id,
            patientName: `${p.first_name} ${p.last_name}`,
            riskLevel: (p.risk_level || 'MEDIUM').toUpperCase(),
            reason: p.risk_reason || 'Sin actividad reciente',
          }));
      }

      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        pendingActionsCount = actionsData.total || actionsData.length || 0;
      }

      set({
        globalInsights: {
          highRiskCount: highRiskPatients.filter(a => a.riskLevel === 'HIGH').length,
          pendingActionsCount,
          activeAlerts: highRiskPatients,
          lastBriefingAt: new Date().toISOString(),
        },
        isLoadingGlobal: false,
      });
    } catch (err) {
      console.error('Failed to fetch global insights:', err);
      // Fallback to mock data for demo
      set({
        globalInsights: {
          highRiskCount: 0,
          pendingActionsCount: 0,
          activeAlerts: [],
          lastBriefingAt: null,
        },
        isLoadingGlobal: false,
      });
    }
  },
}));

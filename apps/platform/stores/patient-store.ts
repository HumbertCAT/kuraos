/**
 * Patient Store (Zustand)
 * 
 * Manages active patient state for AletheIA Observatory.
 * When a patient is selected, insights are fetched and displayed in sidebar.
 */

import { create } from 'zustand';
import { getPatientInsights, AletheiaUIData } from '@/lib/api/aletheia';

type PatientState = {
  // State
  activePatientId: string | null;
  patientName: string | null;
  insights: AletheiaUIData | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActivePatient: (id: string, name: string) => void;
  fetchInsights: () => Promise<void>;
  refreshInsights: () => Promise<void>;
  clearPatient: () => void;
};

export const usePatientStore = create<PatientState>((set, get) => ({
  activePatientId: null,
  patientName: null,
  insights: null,
  isLoading: false,
  error: null,

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
}));

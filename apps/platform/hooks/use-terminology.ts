'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';

type TerminologyContext = 'GROUP' | 'INDIVIDUAL';

interface TerminologyResult {
  singular: string;
  plural: string;
  label: string; // Helper for buttons like "New {label}"
}

/**
 * Dynamic terminology hook for patient/client/consultant labels.
 * 
 * Adapts UI terminology based on:
 * 1. Context override (GROUP → "Participant")
 * 2. Organization preference (PATIENT, CLIENT, or CONSULTANT)
 * 
 * @param context - Optional context override for group services
 * @returns { singular, plural, label } strings for the correct terminology
 * 
 * @example
 * // In a component
 * const { label, plural } = useTerminology();
 * // Returns { singular: "Cliente", plural: "Clientes", label: "Cliente" }
 * 
 * @example
 * // In a group context
 * const { plural } = useTerminology('GROUP');
 * // Always returns { singular: "Participante", plural: "Participantes", label: "Participante" }
 */
export function useTerminology(context?: TerminologyContext): TerminologyResult {
  const { organization } = useAuth();
  const t = useTranslations('terminology');

  // Priority 1: Group context → always "Participant"
  if (context === 'GROUP') {
    return {
      singular: t('participant.singular'),
      plural: t('participant.plural'),
      label: t('participant.singular'),
    };
  }

  // Priority 2: Organization preference (fallback to 'client')
  const preference = organization?.terminology_preference?.toLowerCase() || 'client';
  
  // Validate preference is a known key, fallback to client
  const validPreferences = ['patient', 'client', 'consultant'];
  const safePreference = validPreferences.includes(preference) ? preference : 'client';

  return {
    singular: t(`${safePreference}.singular`),
    plural: t(`${safePreference}.plural`),
    label: t(`${safePreference}.singular`),
  };
}

/**
 * Hook variant for detecting group context from current page/booking.
 * Use this when you need automatic context detection rather than explicit override.
 * 
 * @param isGroupService - Whether the current service/booking is a group type
 * @returns Terminology strings based on service mode
 */
export function useTerminologyForService(isGroupService?: boolean): TerminologyResult {
  return useTerminology(isGroupService ? 'GROUP' : 'INDIVIDUAL');
}

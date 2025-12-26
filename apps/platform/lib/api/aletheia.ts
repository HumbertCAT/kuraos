/**
 * AletheIA API Service
 * 
 * Connects frontend to backend Patient Insights API
 * Endpoint: POST /api/v1/insights/patient/{patientId}
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';

// Alert from backend insights
export type AlertItem = {
  type: 'critical' | 'warning' | 'info';
  message: string;
};

// Matches backend PatientInsightsResponse exactly
export type PatientInsightsResponse = {
  summary: string;
  alerts: AlertItem[];
  suggestions: string[];
  engagementScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  keyThemes: string[];
  lastAnalysis: string | null;
  cached: boolean;
};

// Extended for UI display (future biomarkers/voice)
export type AletheiaUIData = PatientInsightsResponse & {
  // Computed for UI
  riskScore: number;  // Converted from riskLevel: high=-0.9, medium=-0.4, low=0.5
  riskTrend: 'positive' | 'negative' | 'stable';
};

/**
 * Convert backend riskLevel to numeric score for gauge
 */
function riskLevelToScore(level: string): number {
  switch (level) {
    case 'high': return -0.90;
    case 'medium': return -0.40;
    case 'low': return 0.50;
    default: return 0;
  }
}

/**
 * Infer trend from alerts
 */
function inferTrend(alerts: AlertItem[]): 'positive' | 'negative' | 'stable' {
  const hasCritical = alerts.some(a => a.type === 'critical');
  const hasWarning = alerts.some(a => a.type === 'warning');
  
  if (hasCritical) return 'negative';
  if (hasWarning) return 'stable';
  return 'positive';
}

/**
 * Fetch patient insights from backend
 */
export async function getPatientInsights(
  patientId: string,
  refresh: boolean = false
): Promise<AletheiaUIData | null> {
  try {
    const url = `${API_URL}/insights/patient/${patientId}${refresh ? '?refresh=true' : ''}`;
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('AletheIA API error:', response.status);
      return null;
    }

    const data: PatientInsightsResponse = await response.json();

    // Transform to UI format
    return {
      ...data,
      riskScore: riskLevelToScore(data.riskLevel),
      riskTrend: inferTrend(data.alerts),
    };
  } catch (error) {
    console.error('AletheIA fetch error:', error);
    return null;
  }
}

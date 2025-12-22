export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'OWNER' | 'THERAPIST' | 'ASSISTANT';
  is_active: boolean;
  organization_id: string;
  is_superuser?: boolean;
  phone?: string;
  website?: string;
  country?: string;
  city?: string;
  profile_image_url?: string;
  social_media?: Record<string, string>;
  locale?: string;
  ai_output_preference?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: 'SOLO' | 'CLINIC';
  referral_code: string;
  terminology_preference: 'PATIENT' | 'CLIENT' | 'CONSULTANT';
}

export interface AuthResponse {
  user: User;
  organization: Organization;
  message: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  org_name: string;
  referral_code?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  language: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  organization_id: string;
  created_at: string;
  journey_status?: Record<string, string>;
  profile_data?: Record<string, any>;
  profile_image_url?: string | null;
}

export interface PatientListResponse {
  patients: Patient[];
  total: number;
  page: number;
  per_page: number;
}

export interface ClinicalEntry {
  id: string;
  patient_id: string;
  author_id: string;
  entry_type: 'SESSION_NOTE' | 'AUDIO' | 'DOCUMENT' | 'AI_ANALYSIS' | 'ASSESSMENT' | 'FORM_SUBMISSION';
  content: string | null;
  entry_metadata: Record<string, any> | null;
  is_private: boolean;
  happened_at: string;
  created_at: string;
  updated_at: string;
  processing_status: 'IDLE' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processing_error: string | null;
}

export interface ClinicalEntryListResponse {
  entries: ClinicalEntry[];
  total: number;
}

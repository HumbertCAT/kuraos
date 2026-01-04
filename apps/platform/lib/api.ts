// Use api.kuraos.ai for production, localhost for development
let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.kuraos.ai/api/v1';
// Force HTTPS for production domain even if env var says HTTP
if (apiUrl.includes('api.kuraos.ai') && apiUrl.startsWith('http://')) {
  apiUrl = apiUrl.replace('http://', 'https://');
}
if (apiUrl.endsWith('/')) {
  apiUrl = apiUrl.slice(0, -1);
}
export const API_URL = apiUrl;

interface ApiError {
  detail: string;
}

export interface ListMetadata {
  total: number;
  filtered: number;
  page: number;
  page_size: number;
  extra: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: ListMetadata;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Auto-redirect to login on authentication failure
    // But only if we're not on an auth page or public form page (prevent loop/unwanted redirect)
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        const isPublicPage = window.location.pathname.includes('/login') || 
                            window.location.pathname.includes('/register') ||
                            window.location.pathname.includes('/f/');  // Public forms
        if (!isPublicPage) {
          // CRITICAL: Call logout to clear the stale HttpOnly cookie on the backend
          // Without this, the middleware sees the old cookie and keeps redirecting to dashboard
          try {
            await fetch(`${API_URL}/auth/logout`, {
              method: 'POST',
              credentials: 'include',
            });
          } catch (e) {
            // Ignore logout errors, proceed to redirect anyway
            console.warn('[api] Logout failed during 401 cleanup:', e);
          }
          window.location.href = '/en/login';
          throw new Error('Session expired. Redirecting to login...');
        }
      }
    }
    const errorData = (await response.json()) as ApiError;
    throw new Error(errorData.detail || 'An error occurred');
  }
  return response.json();
}

export const api = {
  auth: {
    register: async (data: any) => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include', // Important for cookies
      });
      return handleResponse<any>(res);
    },

    login: async (data: any) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include', // Important for cookies
      });
      return handleResponse<any>(res);
    },

    logout: async () => {
      const res = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      return handleResponse<{ message: string }>(res);
    },

    getMe: async () => {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },
  },

  patients: {
    list: async (page = 1, search = '', statusFilter = '') => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status_filter', statusFilter);
      const res = await fetch(`${API_URL}/patients/?${params}`, {
        credentials: 'include',
      });
      return handleResponse<PaginatedResponse<any>>(res);
    },

    create: async (data: any) => {
      const res = await fetch(`${API_URL}/patients/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    get: async (id: string) => {
      const res = await fetch(`${API_URL}/patients/${id}/`, {
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    update: async (id: string, data: any) => {
      const res = await fetch(`${API_URL}/patients/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/patients/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Delete failed');
      }
    },
  },
  
  services: {
    list: async (page = 1, perPage = 100, activeOnly = false) => {
      const params = new URLSearchParams({ 
        page: String(page),
        per_page: String(perPage),
        active_only: String(activeOnly)
      });
      const res = await fetch(`${API_URL}/services/?${params}`, {
        credentials: 'include',
      });
      return handleResponse<PaginatedResponse<any>>(res);
    },
    
    get: async (id: string) => {
      const res = await fetch(`${API_URL}/services/${id}/`, {
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    create: async (data: any) => {
      const res = await fetch(`${API_URL}/services/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    update: async (id: string, data: any) => {
      const res = await fetch(`${API_URL}/services/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/services/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Delete failed');
      }
    },
  },

  clinicalEntries: {
    list: async (patientId: string) => {
      const res = await fetch(`${API_URL}/clinical-entries/patient/${patientId}/`, {
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    create: async (data: any) => {
      const res = await fetch(`${API_URL}/clinical-entries/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    update: async (id: string, data: any) => {
      const res = await fetch(`${API_URL}/clinical-entries/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/clinical-entries/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Delete failed');
      }
    },

    analyze: async (id: string) => {
      const res = await fetch(`${API_URL}/clinical-entries/${id}/analyze`, {
        method: 'POST',
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },
  },

  uploads: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/uploads/`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },
  },

  admin: {
    // Settings
    listSettings: async () => {
      const res = await fetch(`${API_URL}/admin/settings`, {
        credentials: 'include',
      });
      return handleResponse<any[]>(res);
    },

    updateSetting: async (key: string, value: any, description?: string) => {
      const res = await fetch(`${API_URL}/admin/settings/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, description }),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    // Organizations
    listOrganizations: async () => {
      const res = await fetch(`${API_URL}/admin/organizations`, {
        credentials: 'include',
      });
      return handleResponse<any[]>(res);
    },

    updateOrganization: async (id: string, data: Partial<{ tier: string; ai_credits_monthly_quota: number; terminology_preference: string }>) => {
      const res = await fetch(`${API_URL}/admin/organizations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    addCredits: async (orgId: string, credits: number) => {
      const res = await fetch(`${API_URL}/admin/organizations/${orgId}/add-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits }),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    updateTheme: async (orgId: string, themeConfig: Record<string, unknown>) => {
      const res = await fetch(`${API_URL}/admin/organizations/${orgId}/theme`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_config: themeConfig }),
        credentials: 'include',
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },
  },

  user: {
    updatePreferences: async (data: { 
      locale?: string; 
      ai_output_preference?: string;
      full_name?: string;
      phone?: string;
      website?: string;
      country?: string;
      city?: string;
      social_media?: any;
    }) => {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },
    getCredits: async () => {
      const res = await fetch(`${API_URL}/auth/me/credits`, {
        credentials: 'include',
      });
      return handleResponse<{
        tier: string;
        monthly_quota: number;
        used_this_month: number;
        purchased: number;
        available: number;
      }>(res);
    },
  },

  availability: {
    listSpecific: async (upcomingOnly = true) => {
      const res = await fetch(`${API_URL}/availability/specific?upcoming_only=${upcomingOnly}`, {
        credentials: 'include',
      });
      return handleResponse<any[]>(res);
    },

    createSpecific: async (data: { start_datetime: string; end_datetime: string }) => {
      const res = await fetch(`${API_URL}/availability/specific`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    deleteSpecific: async (id: string) => {
      const res = await fetch(`${API_URL}/availability/specific/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Delete failed');
      }
    },
  },

  bookings: {
    list: async (filters?: { 
      service_id?: string; 
      patient_id?: string; 
      status?: string; 
      start_date?: string; 
      end_date?: string;
      page?: number;
      per_page?: number;
      sort_by?: string;
      order?: 'asc' | 'desc';
    }) => {
      const params = new URLSearchParams();
      if (filters?.service_id) params.append('service_id', filters.service_id);
      if (filters?.patient_id) params.append('patient_id', filters.patient_id);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.per_page) params.append('per_page', String(filters.per_page));
      if (filters?.sort_by) params.append('sort_by', filters.sort_by);
      if (filters?.order) params.append('order', filters.order);
      
      const res = await fetch(`${API_URL}/booking/?${params}`, {
        credentials: 'include',
      });
      return handleResponse<PaginatedResponse<any>>(res);
    },

    updateStatus: async (bookingId: string, newStatus: string) => {
      const res = await fetch(`${API_URL}/booking/${bookingId}/status/?new_status=${newStatus}`, {
        method: 'PATCH',
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    delete: async (bookingId: string) => {
      const res = await fetch(`${API_URL}/booking/${bookingId}/`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Delete failed');
      }
    },

    cancel: async (bookingId: string, reason?: string) => {
      const res = await fetch(`${API_URL}/booking/${bookingId}/cancel/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: reason || null }),
      });
      return handleResponse<any>(res);
    },

    reschedule: async (bookingId: string, newStartTime: string, reason?: string) => {
      const res = await fetch(`${API_URL}/booking/${bookingId}/reschedule/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          new_start_time: newStartTime,
          reason: reason || null 
        }),
      });
      return handleResponse<any>(res);
    },
  },

  schedules: {
    list: async () => {
      const res = await fetch(`${API_URL}/schedules/`, {
        credentials: 'include',
      });
      return handleResponse<any[]>(res);
    },

    create: async (name: string) => {
      const res = await fetch(`${API_URL}/schedules/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    update: async (scheduleId: string, name: string) => {
      const res = await fetch(`${API_URL}/schedules/${scheduleId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    delete: async (scheduleId: string) => {
      const res = await fetch(`${API_URL}/schedules/${scheduleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error deleting schedule');
      }
    },

    setDefault: async (scheduleId: string) => {
      const res = await fetch(`${API_URL}/schedules/${scheduleId}/set-default/`, {
        method: 'POST',
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },
  },

  insights: {
    getPatientInsights: async (patientId: string, refresh = false) => {
      const url = refresh 
        ? `${API_URL}/insights/patient/${patientId}?refresh=true`
        : `${API_URL}/insights/patient/${patientId}`;
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
      });
      return handleResponse<{
        summary: string;
        alerts: { type: 'warning' | 'critical' | 'info'; message: string }[];
        suggestions: string[];
        engagementScore: number;
        riskLevel: 'low' | 'medium' | 'high';
        keyThemes: string[];
        lastAnalysis: string | null;
        cached: boolean;
      }>(res);
    },
  },

  forms: {
    listTemplates: async (page = 1, perPage = 20) => {
      const params = new URLSearchParams({ 
        page: String(page),
        per_page: String(perPage)
      });
      const res = await fetch(`${API_URL}/forms/templates?${params}`, {
        credentials: 'include',
      });
      return handleResponse<PaginatedResponse<any>>(res);
    },

    createAssignment: async (data: { patient_id: string; template_id: string; valid_days?: number }) => {
      const res = await fetch(`${API_URL}/forms/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<{ token: string; expires_at: string }>(res);
    },
  },

  help: {
    chat: async (message: string, currentRoute: string, history: { role: string; content: string }[]) => {
      const res = await fetch(`${API_URL}/help/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          current_route: currentRoute,
          history,
        }),
        credentials: 'include',
      });
      return handleResponse<{ response: string }>(res);
    },
  },

  pendingActions: {
    list: async () => {
      const res = await fetch(`${API_URL}/pending-actions`, {
        credentials: 'include',
      });
      return handleResponse<{ actions: any[]; total: number }>(res);
    },

    approve: async (actionId: string) => {
      const res = await fetch(`${API_URL}/pending-actions/${actionId}/approve/`, {
        method: 'POST',
        credentials: 'include',
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },

    reject: async (actionId: string) => {
      const res = await fetch(`${API_URL}/pending-actions/${actionId}/reject/`, {
        method: 'POST',
        credentials: 'include',
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },
  },

  publicBooking: {
    listServices: async (therapistId: string) => {
      const res = await fetch(`${API_URL}/public/booking/services?therapist_id=${therapistId}`);
      // Note: Public endpoints might still return flat lists if not refactored yet,
      // but let's assume Consistency for now if they are part of the target refactor.
      return handleResponse<any[]>(res); 
    },

    listSlots: async (therapistId: string, serviceId: string, startDate: string, endDate: string) => {
      const res = await fetch(
        `${API_URL}/public/booking/slots?therapist_id=${therapistId}&service_id=${serviceId}&start_date=${startDate}&end_date=${endDate}`
      );
      return handleResponse<any[]>(res);
    },

    createBooking: async (data: any) => {
      const res = await fetch(`${API_URL}/public/booking/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse<any>(res);
    },
  },

  leads: {
    list: async (filters?: { limit?: number; offset?: number; status?: string; include_archived?: boolean }) => {
      const params = new URLSearchParams();
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.offset) params.append('offset', String(filters.offset));
      if (filters?.status) params.append('status', filters.status);
      if (filters?.include_archived) params.append('include_archived', String(filters.include_archived));
      
      const res = await fetch(`${API_URL}/leads/?${params}`, {
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },

    create: async (data: { first_name: string; last_name: string; email?: string; phone?: string; notes?: string; source?: string }) => {
      const res = await fetch(`${API_URL}/leads/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },
    
    get: async (id: string) => {
      const res = await fetch(`${API_URL}/leads/${id}/`, {
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },
    
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_URL}/leads/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },
    
    convert: async (id: string) => {
      const res = await fetch(`${API_URL}/leads/${id}/convert/`, {
        method: 'POST',
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },
  },

  growth: {
    getStats: async () => {
      const res = await fetch(`${API_URL}/growth/stats`, {
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },
  },

  dashboard: {
    getFocus: async () => {
      const res = await fetch(`${API_URL}/dashboard/focus`, {
        credentials: 'include',
      });
      return handleResponse<any>(res);
    },
  },
};

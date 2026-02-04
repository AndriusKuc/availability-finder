import type {
  ApiResponse,
  Survey,
  SurveyWithCount,
  Submission,
} from '@/types';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Survey endpoints
export const surveyApi = {
  getByCode: (code: string) =>
    request<Survey>(`/surveys/${code}`),

  checkName: (code: string, name: string) =>
    request<{ exists: boolean }>(
      `/surveys/${code}/check-name/${encodeURIComponent(name)}`
    ),

  submit: (code: string, personName: string, unavailableDates: string[]) =>
    request<void>(`/surveys/${code}/submit`, {
      method: 'POST',
      body: JSON.stringify({ personName, unavailableDates }),
    }),
};

// Admin endpoints
export const adminApi = {
  checkAuth: () =>
    request<{ authenticated: boolean }>('/admin/check-auth'),

  login: (password: string) =>
    request<void>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  logout: () =>
    request<void>('/admin/logout', { method: 'POST' }),

  getSurveys: () =>
    request<SurveyWithCount[]>('/admin/surveys'),

  createSurvey: (name: string, startDate: string, endDate: string) =>
    request<Survey>('/admin/surveys', {
      method: 'POST',
      body: JSON.stringify({ name, startDate, endDate }),
    }),

  deleteSurvey: (id: number) =>
    request<void>(`/admin/surveys/${id}`, { method: 'DELETE' }),

  getSubmissions: (surveyId: number) =>
    request<Submission[]>(`/admin/surveys/${surveyId}/submissions`),

  resetSubmissions: (surveyId: number) =>
    request<void>(`/admin/surveys/${surveyId}/submissions`, {
      method: 'DELETE',
    }),

  deleteSubmission: (id: number) =>
    request<void>(`/admin/submissions/${id}`, { method: 'DELETE' }),
};

export interface Survey {
  id: number;
  code: string;
  name: string;
  created_at: string;
}

export interface SurveyWithCount extends Survey {
  submission_count: number;
}

export interface Submission {
  id: number;
  survey_id: number;
  person_name: string;
  unavailable_dates: string[];
  created_at: string;
}

export interface SubmissionRow {
  id: number;
  survey_id: number;
  person_name: string;
  unavailable_dates: string;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

declare module 'express-session' {
  interface SessionData {
    isAdmin: boolean;
  }
}

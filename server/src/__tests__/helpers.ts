import request from 'supertest';
import { Express } from 'express';
import db from '../config/database';
import type { Survey } from '../types';

export function createTestSurvey(
  name = 'Test Survey',
  startDate = '2025-01-01',
  endDate = '2025-12-31'
): Survey {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();

  const result = db
    .prepare('INSERT INTO surveys (code, name, start_date, end_date) VALUES (?, ?, ?, ?)')
    .run(code, name, startDate, endDate);

  return db.prepare('SELECT * FROM surveys WHERE id = ?').get(result.lastInsertRowid) as Survey;
}

export function createTestSubmission(
  surveyId: number,
  personName: string,
  unavailableDates: string[] = []
): void {
  db.prepare(
    'INSERT INTO submissions (survey_id, person_name, unavailable_dates) VALUES (?, ?, ?)'
  ).run(surveyId, personName, JSON.stringify(unavailableDates));
}

export async function loginAsAdmin(app: Express): Promise<string[]> {
  const response = await request(app)
    .post('/api/admin/login')
    .send({ password: 'test-password' });

  const cookies = response.headers['set-cookie'];
  if (Array.isArray(cookies)) {
    return cookies;
  }
  return cookies ? [cookies] : [];
}

export function makeAuthenticatedRequest(app: Express, cookies: string[]) {
  return {
    get: (url: string) => request(app).get(url).set('Cookie', cookies),
    post: (url: string) => request(app).post(url).set('Cookie', cookies),
    delete: (url: string) => request(app).delete(url).set('Cookie', cookies),
  };
}

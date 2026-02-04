import request from 'supertest';
import { createApp } from '../app';
import { createTestSurvey, createTestSubmission } from './helpers';

const app = createApp();

describe('Survey Routes', () => {
  describe('GET /api/surveys/:code', () => {
    it('should return survey by code', async () => {
      const survey = createTestSurvey('My Survey');

      const response = await request(app).get(`/api/surveys/${survey.code}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('My Survey');
      expect(response.body.data.code).toBe(survey.code);
    });

    it('should return 404 for non-existent survey', async () => {
      const response = await request(app).get('/api/surveys/NOTFOUND');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Survey not found');
    });

    it('should be case-insensitive for survey code', async () => {
      const survey = createTestSurvey();

      const response = await request(app).get(
        `/api/surveys/${survey.code.toLowerCase()}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.code).toBe(survey.code);
    });
  });

  describe('GET /api/surveys/:code/check-name/:name', () => {
    it('should return exists: false for new name', async () => {
      const survey = createTestSurvey();

      const response = await request(app).get(
        `/api/surveys/${survey.code}/check-name/John`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.exists).toBe(false);
    });

    it('should return exists: true for existing name', async () => {
      const survey = createTestSurvey();
      createTestSubmission(survey.id, 'John');

      const response = await request(app).get(
        `/api/surveys/${survey.code}/check-name/John`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.exists).toBe(true);
    });

    it('should be case-insensitive for name check', async () => {
      const survey = createTestSurvey();
      createTestSubmission(survey.id, 'John');

      const response = await request(app).get(
        `/api/surveys/${survey.code}/check-name/JOHN`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.exists).toBe(true);
    });

    it('should return 404 for non-existent survey', async () => {
      const response = await request(app).get(
        '/api/surveys/NOTFOUND/check-name/John'
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/surveys/:code/submit', () => {
    it('should submit availability successfully', async () => {
      const survey = createTestSurvey();

      const response = await request(app)
        .post(`/api/surveys/${survey.code}/submit`)
        .send({
          personName: 'Jane',
          unavailableDates: ['2025-01-15', '2025-01-16'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject submission without name', async () => {
      const survey = createTestSurvey();

      const response = await request(app)
        .post(`/api/surveys/${survey.code}/submit`)
        .send({
          personName: '',
          unavailableDates: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name is required');
    });

    it('should reject duplicate submission', async () => {
      const survey = createTestSurvey();
      createTestSubmission(survey.id, 'Jane');

      const response = await request(app)
        .post(`/api/surveys/${survey.code}/submit`)
        .send({
          personName: 'Jane',
          unavailableDates: [],
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already submitted');
    });

    it('should return 404 for non-existent survey', async () => {
      const response = await request(app)
        .post('/api/surveys/NOTFOUND/submit')
        .send({
          personName: 'Jane',
          unavailableDates: [],
        });

      expect(response.status).toBe(404);
    });

    it('should handle empty unavailable dates', async () => {
      const survey = createTestSurvey();

      const response = await request(app)
        .post(`/api/surveys/${survey.code}/submit`)
        .send({
          personName: 'Bob',
          unavailableDates: [],
        });

      expect(response.status).toBe(200);
    });
  });
});

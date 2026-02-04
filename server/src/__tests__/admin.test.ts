import request from 'supertest';
import { createApp } from '../app';
import {
  createTestSurvey,
  createTestSubmission,
  loginAsAdmin,
  makeAuthenticatedRequest,
} from './helpers';

const app = createApp();

describe('Admin Routes', () => {
  describe('POST /api/admin/login', () => {
    it('should login with correct password', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({ password: 'test-password' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({ password: 'wrong-password' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/check-auth', () => {
    it('should return authenticated: false when not logged in', async () => {
      const response = await request(app).get('/api/admin/check-auth');

      expect(response.status).toBe(200);
      expect(response.body.data.authenticated).toBe(false);
    });

    it('should return authenticated: true when logged in', async () => {
      const cookies = await loginAsAdmin(app);
      const auth = makeAuthenticatedRequest(app, cookies);

      const response = await auth.get('/api/admin/check-auth');

      expect(response.status).toBe(200);
      expect(response.body.data.authenticated).toBe(true);
    });
  });

  describe('POST /api/admin/logout', () => {
    it('should logout successfully', async () => {
      const cookies = await loginAsAdmin(app);
      const auth = makeAuthenticatedRequest(app, cookies);

      const response = await auth.post('/api/admin/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/surveys', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/admin/surveys');

      expect(response.status).toBe(401);
    });

    it('should return all surveys when authenticated', async () => {
      const cookies = await loginAsAdmin(app);
      const auth = makeAuthenticatedRequest(app, cookies);

      createTestSurvey('Survey 1');
      createTestSurvey('Survey 2');

      const response = await auth.get('/api/admin/surveys');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it('should include submission count', async () => {
      const cookies = await loginAsAdmin(app);
      const auth = makeAuthenticatedRequest(app, cookies);

      const survey = createTestSurvey();
      createTestSubmission(survey.id, 'User 1');
      createTestSubmission(survey.id, 'User 2');

      const response = await auth.get('/api/admin/surveys');

      expect(response.status).toBe(200);
      expect(response.body.data[0].submission_count).toBe(2);
    });
  });

  describe('POST /api/admin/surveys', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/admin/surveys')
        .send({ name: 'Test', startDate: '2025-01-01', endDate: '2025-12-31' });

      expect(response.status).toBe(401);
    });

    it('should create survey when authenticated', async () => {
      const cookies = await loginAsAdmin(app);
      const auth = makeAuthenticatedRequest(app, cookies);

      const response = await auth
        .post('/api/admin/surveys')
        .send({ name: 'New Survey', startDate: '2025-01-01', endDate: '2025-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('New Survey');
      expect(response.body.data.code).toBeDefined();
      expect(response.body.data.start_date).toBe('2025-01-01');
      expect(response.body.data.end_date).toBe('2025-12-31');
    });

    it('should reject survey without name', async () => {
      const cookies = await loginAsAdmin(app);
      const auth = makeAuthenticatedRequest(app, cookies);

      const response = await auth
        .post('/api/admin/surveys')
        .send({ name: '', startDate: '2025-01-01', endDate: '2025-12-31' });

      expect(response.status).toBe(400);
    });

    it('should reject survey without dates', async () => {
      const cookies = await loginAsAdmin(app);
      const auth = makeAuthenticatedRequest(app, cookies);

      const response = await auth
        .post('/api/admin/surveys')
        .send({ name: 'Test Survey' });

      expect(response.status).toBe(400);
    });

    it('should reject survey with invalid date range', async () => {
      const cookies = await loginAsAdmin(app);
      const auth = makeAuthenticatedRequest(app, cookies);

      const response = await auth
        .post('/api/admin/surveys')
        .send({ name: 'Test', startDate: '2025-12-31', endDate: '2025-01-01' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('before');
    });
  });

  describe('DELETE /api/admin/surveys/:id', () => {
    it('should require authentication', async () => {
      const survey = createTestSurvey();

      const response = await request(app).delete(`/api/admin/surveys/${survey.id}`);

      expect(response.status).toBe(401);
    });

    it('should delete survey when authenticated', async () => {
      const cookies = await loginAsAdmin(app);
      const auth = makeAuthenticatedRequest(app, cookies);

      const survey = createTestSurvey();

      const response = await auth.delete(`/api/admin/surveys/${survey.id}`);

      expect(response.status).toBe(200);

      // Verify survey is deleted
      const checkResponse = await request(app).get(`/api/surveys/${survey.code}`);
      expect(checkResponse.status).toBe(404);
    });
  });

  describe('GET /api/admin/surveys/:id/submissions', () => {
    it('should require authentication', async () => {
      const survey = createTestSurvey();

      const response = await request(app).get(
        `/api/admin/surveys/${survey.id}/submissions`
      );

      expect(response.status).toBe(401);
    });

    it('should return submissions when authenticated', async () => {
      const cookies = await loginAsAdmin(app);
      const auth = makeAuthenticatedRequest(app, cookies);

      const survey = createTestSurvey();
      createTestSubmission(survey.id, 'Alice', ['2025-01-01']);
      createTestSubmission(survey.id, 'Bob', ['2025-01-02', '2025-01-03']);

      const response = await auth.get(`/api/admin/surveys/${survey.id}/submissions`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].unavailable_dates).toBeInstanceOf(Array);
    });
  });

  describe('DELETE /api/admin/surveys/:id/submissions', () => {
    it('should reset all submissions', async () => {
      const cookies = await loginAsAdmin(app);
      const auth = makeAuthenticatedRequest(app, cookies);

      const survey = createTestSurvey();
      createTestSubmission(survey.id, 'Alice');
      createTestSubmission(survey.id, 'Bob');

      const response = await auth.delete(`/api/admin/surveys/${survey.id}/submissions`);

      expect(response.status).toBe(200);

      // Verify submissions are deleted
      const checkResponse = await auth.get(
        `/api/admin/surveys/${survey.id}/submissions`
      );
      expect(checkResponse.body.data).toHaveLength(0);
    });
  });

  describe('DELETE /api/admin/submissions/:id', () => {
    it('should delete single submission', async () => {
      const cookies = await loginAsAdmin(app);
      const auth = makeAuthenticatedRequest(app, cookies);

      const survey = createTestSurvey();
      createTestSubmission(survey.id, 'Alice');
      createTestSubmission(survey.id, 'Bob');

      // Get submission ID
      const listResponse = await auth.get(
        `/api/admin/surveys/${survey.id}/submissions`
      );
      const submissionId = listResponse.body.data[0].id;

      const response = await auth.delete(`/api/admin/submissions/${submissionId}`);

      expect(response.status).toBe(200);

      // Verify only one submission remains
      const checkResponse = await auth.get(
        `/api/admin/surveys/${survey.id}/submissions`
      );
      expect(checkResponse.body.data).toHaveLength(1);
    });
  });
});

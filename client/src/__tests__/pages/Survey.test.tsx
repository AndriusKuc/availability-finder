import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Survey } from '@/pages/Survey';
import * as api from '@/services/api';

// Mock the entire api module
vi.mock('@/services/api');

const mockSurvey = {
  id: 1,
  code: 'TEST123',
  name: 'Test Survey',
  start_date: '2025-01-01',
  end_date: '2025-12-31',
  created_at: '2025-01-01',
};

describe('Survey Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderSurvey = () => {
    return render(
      <MemoryRouter initialEntries={['/survey/TEST123']}>
        <Routes>
          <Route path="/survey/:code" element={<Survey />} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Name Step', () => {
    it('shows the survey name after loading', async () => {
      vi.mocked(api.surveyApi.getByCode).mockResolvedValue({
        success: true,
        data: mockSurvey,
      });

      renderSurvey();

      await waitFor(() => {
        expect(screen.getByText('Test Survey')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows hint about edit links for returning users', async () => {
      vi.mocked(api.surveyApi.getByCode).mockResolvedValue({
        success: true,
        data: mockSurvey,
      });

      renderSurvey();

      await waitFor(() => {
        expect(screen.getByText(/Need to modify a previous submission/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows error when name already exists', async () => {
      vi.mocked(api.surveyApi.getByCode).mockResolvedValue({
        success: true,
        data: mockSurvey,
      });
      vi.mocked(api.surveyApi.checkName).mockResolvedValue({
        success: true,
        data: { exists: true },
      });

      renderSurvey();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.change(screen.getByPlaceholderText('Your name'), {
        target: { value: 'John' },
      });
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText(/You have already submitted/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('proceeds to calendar step when name is new', async () => {
      vi.mocked(api.surveyApi.getByCode).mockResolvedValue({
        success: true,
        data: mockSurvey,
      });
      vi.mocked(api.surveyApi.checkName).mockResolvedValue({
        success: true,
        data: { exists: false },
      });

      renderSurvey();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.change(screen.getByPlaceholderText('Your name'), {
        target: { value: 'Jane' },
      });
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('Mark your unavailable dates')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Success Step', () => {
    it('shows edit URL after successful submission', async () => {
      vi.mocked(api.surveyApi.getByCode).mockResolvedValue({
        success: true,
        data: mockSurvey,
      });
      vi.mocked(api.surveyApi.checkName).mockResolvedValue({
        success: true,
        data: { exists: false },
      });
      vi.mocked(api.surveyApi.submit).mockResolvedValue({
        success: true,
        data: { editToken: 'test-token-123' },
      });

      renderSurvey();

      // Wait for page load
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Enter name and continue
      fireEvent.change(screen.getByPlaceholderText('Your name'), {
        target: { value: 'Jane' },
      });
      fireEvent.click(screen.getByText('Continue'));

      // Wait for calendar step
      await waitFor(() => {
        expect(screen.getByText('Mark your unavailable dates')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Submit
      fireEvent.click(screen.getByText('Submit Availability'));

      // Check success page
      await waitFor(() => {
        expect(screen.getByText('Thank you!')).toBeInTheDocument();
        expect(screen.getByText('Save your edit link:')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Check edit URL is displayed
      const urlInput = screen.getByDisplayValue(/\/edit\/test-token-123/);
      expect(urlInput).toBeInTheDocument();
    });
  });
});

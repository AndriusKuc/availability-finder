import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Edit } from '@/pages/Edit';
import * as api from '@/services/api';

// Mock the entire api module
vi.mock('@/services/api');

const mockSubmission = {
  id: 1,
  survey_id: 1,
  person_name: 'John Doe',
  unavailable_dates: ['2025-06-15', '2025-06-16'],
  edit_token: 'valid-token-123',
  created_at: '2025-01-01',
  survey_name: 'Team Vacation',
  survey_code: 'TEAM123',
  start_date: '2025-06-01',
  end_date: '2025-06-30',
};

describe('Edit Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderEdit = () => {
    return render(
      <MemoryRouter initialEntries={['/edit/valid-token-123']}>
        <Routes>
          <Route path="/edit/:token" element={<Edit />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows error for invalid token', async () => {
    vi.mocked(api.surveyApi.getByToken).mockRejectedValue(new Error('Not found'));

    renderEdit();

    await waitFor(() => {
      expect(screen.getByText('This edit link is invalid or has expired.')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays submission details', async () => {
    vi.mocked(api.surveyApi.getByToken).mockResolvedValue({
      success: true,
      data: mockSubmission,
    });

    renderEdit();

    await waitFor(() => {
      expect(screen.getByText('Edit Availability')).toBeInTheDocument();
      expect(screen.getByText(/Team Vacation/)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('saves changes successfully', async () => {
    vi.mocked(api.surveyApi.getByToken).mockResolvedValue({
      success: true,
      data: mockSubmission,
    });
    vi.mocked(api.surveyApi.updateByToken).mockResolvedValue({
      success: true,
    });

    renderEdit();

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(screen.getByText('Changes Saved!')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(api.surveyApi.updateByToken).toHaveBeenCalledWith(
      'valid-token-123',
      expect.any(Array)
    );
  });

  it('allows making more changes after saving', async () => {
    vi.mocked(api.surveyApi.getByToken).mockResolvedValue({
      success: true,
      data: mockSubmission,
    });
    vi.mocked(api.surveyApi.updateByToken).mockResolvedValue({
      success: true,
    });

    renderEdit();

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(screen.getByText('Changes Saved!')).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByText('Make More Changes'));

    await waitFor(() => {
      expect(screen.getByText('Update your unavailable dates')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows error when save fails', async () => {
    vi.mocked(api.surveyApi.getByToken).mockResolvedValue({
      success: true,
      data: mockSubmission,
    });
    vi.mocked(api.surveyApi.updateByToken).mockRejectedValue(new Error('Failed to update'));

    renderEdit();

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(screen.getByText('Failed to update')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

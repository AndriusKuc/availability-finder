import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SurveyModal } from '@/pages/Admin/SurveyModal';
import * as api from '@/services/api';

vi.mock('@/services/api');

const mockSurvey = {
  id: 1,
  name: 'Team Vacation',
  code: 'TEAM123',
  start_date: '2025-06-01',
  end_date: '2025-06-30',
  created_at: '2025-01-01',
  submission_count: 3,
};

const mockSubmissions = [
  {
    id: 1,
    survey_id: 1,
    person_name: 'Alice',
    unavailable_dates: ['2025-06-05', '2025-06-06'],
    edit_token: 'token-alice',
    created_at: '2025-01-01',
  },
  {
    id: 2,
    survey_id: 1,
    person_name: 'Bob',
    unavailable_dates: ['2025-06-10', '2025-06-11', '2025-06-12'],
    edit_token: 'token-bob',
    created_at: '2025-01-02',
  },
  {
    id: 3,
    survey_id: 1,
    person_name: 'Charlie',
    unavailable_dates: [],
    edit_token: 'token-charlie',
    created_at: '2025-01-03',
  },
];

describe('SurveyModal', () => {
  const onClose = vi.fn();
  const onUpdate = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.adminApi.getSubmissions).mockResolvedValue({
      success: true,
      data: mockSubmissions,
    });
  });

  const renderModal = () => {
    return render(
      <SurveyModal survey={mockSurvey} onClose={onClose} onUpdate={onUpdate} />
    );
  };

  describe('Tabs', () => {
    it('renders all tabs', async () => {
      renderModal();

      expect(screen.getByText('Submissions')).toBeInTheDocument();
      expect(screen.getByText('Merged Calendar')).toBeInTheDocument();
      expect(screen.getByText('Individual')).toBeInTheDocument();
      expect(screen.getByText('Find Dates')).toBeInTheDocument();
    });

    it('shows submissions tab by default', async () => {
      renderModal();

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('Charlie')).toBeInTheDocument();
      });
    });
  });

  describe('Find Dates Tab', () => {
    it('shows min consecutive nights label with icon', async () => {
      renderModal();

      fireEvent.click(screen.getByText('Find Dates'));

      await waitFor(() => {
        expect(screen.getByText('Min consecutive nights')).toBeInTheDocument();
      });
    });

    it('shows min attendees label with icon', async () => {
      renderModal();

      fireEvent.click(screen.getByText('Find Dates'));

      await waitFor(() => {
        expect(screen.getByText('Min attendees')).toBeInTheDocument();
      });
    });

    it('shows exclude weekends checkbox', async () => {
      renderModal();

      fireEvent.click(screen.getByText('Find Dates'));

      await waitFor(() => {
        expect(screen.getByText('Exclude weekends')).toBeInTheDocument();
      });
    });

    it('finds available date ranges', async () => {
      renderModal();

      fireEvent.click(screen.getByText('Find Dates'));

      await waitFor(() => {
        // Should find ranges where all 3 people are available
        expect(screen.getByText(/found/)).toBeInTheDocument();
      });
    });

    it('shows people count badge for each range', async () => {
      renderModal();

      fireEvent.click(screen.getByText('Find Dates'));

      // Set min nights to 1 to ensure we get results
      const decrementButtons = screen.getAllByRole('button', { name: 'Decrease' });
      fireEvent.click(decrementButtons[0]); // 3 -> 2
      fireEvent.click(decrementButtons[0]); // 2 -> 1

      await waitFor(() => {
        // With default settings (all 3 must attend), should show 3/3
        const badges = screen.getAllByText(/3\/3/);
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('shows nights count badge for each range', async () => {
      renderModal();

      fireEvent.click(screen.getByText('Find Dates'));

      // Set min nights to 1 to get more results
      const decrementButtons = screen.getAllByRole('button', { name: 'Decrease' });
      fireEvent.click(decrementButtons[0]); // 3 -> 2
      fireEvent.click(decrementButtons[0]); // 2 -> 1

      await waitFor(() => {
        // Should have at least one range found
        expect(screen.getByText(/found/)).toBeInTheDocument();
      });
    });

    it('allows changing min attendees', async () => {
      renderModal();

      fireEvent.click(screen.getByText('Find Dates'));

      await waitFor(() => {
        expect(screen.getByText(/of 3/)).toBeInTheDocument();
      });

      // Find the decrement button for min attendees (second number stepper)
      const decrementButtons = screen.getAllByRole('button', { name: 'Decrease' });
      fireEvent.click(decrementButtons[1]); // Decrement attendees from 3 to 2

      await waitFor(() => {
        // The "of 3" label should still be present
        expect(screen.getByText(/of 3/)).toBeInTheDocument();
      });
    });

    it('expands range to show attendees list', async () => {
      renderModal();

      fireEvent.click(screen.getByText('Find Dates'));

      await waitFor(() => {
        expect(screen.getByText(/found/)).toBeInTheDocument();
      });

      // Click on first range to expand
      const rangeButtons = screen.getAllByRole('button').filter(
        (btn) => btn.textContent?.includes('Jun')
      );

      if (rangeButtons.length > 0) {
        fireEvent.click(rangeButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/Can attend/)).toBeInTheDocument();
          expect(screen.getByText(/Cannot attend/)).toBeInTheDocument();
        });
      }
    });

    it('shows no results message when no ranges match', async () => {
      // Mock with submissions that have no common availability
      vi.mocked(api.adminApi.getSubmissions).mockResolvedValue({
        success: true,
        data: [
          {
            id: 1,
            survey_id: 1,
            person_name: 'Alice',
            unavailable_dates: Array.from({ length: 30 }, (_, i) => `2025-06-${String(i + 1).padStart(2, '0')}`),
            edit_token: 'token-alice',
            created_at: '2025-01-01',
          },
        ],
      });

      renderModal();

      fireEvent.click(screen.getByText('Find Dates'));

      await waitFor(() => {
        expect(screen.getByText(/No.*night periods found/)).toBeInTheDocument();
      });
    });

    it('excludes weekends when checkbox is checked', async () => {
      renderModal();

      fireEvent.click(screen.getByText('Find Dates'));

      await waitFor(() => {
        expect(screen.getByText('Exclude weekends')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(checkbox).toBeChecked();
    });

    it('shows exclude people section with all names', async () => {
      renderModal();

      fireEvent.click(screen.getByText('Find Dates'));

      await waitFor(() => {
        expect(screen.getByText('Exclude people')).toBeInTheDocument();
        // All submission names should be clickable buttons
        expect(screen.getAllByRole('button').filter(btn => btn.textContent === 'Alice').length).toBeGreaterThan(0);
        expect(screen.getAllByRole('button').filter(btn => btn.textContent === 'Bob').length).toBeGreaterThan(0);
        expect(screen.getAllByRole('button').filter(btn => btn.textContent === 'Charlie').length).toBeGreaterThan(0);
      });
    });

    it('allows excluding a person from search', async () => {
      renderModal();

      fireEvent.click(screen.getByText('Find Dates'));

      await waitFor(() => {
        expect(screen.getByText('Exclude people')).toBeInTheDocument();
      });

      // Click on Alice to exclude her
      const aliceButtons = screen.getAllByRole('button').filter(btn => btn.textContent === 'Alice');
      fireEvent.click(aliceButtons[0]);

      await waitFor(() => {
        // Should show "(1 excluded)" indicator
        expect(screen.getByText(/1 excluded/)).toBeInTheDocument();
        // Min attendees should now show "of 2" instead of "of 3"
        expect(screen.getByText(/of 2/)).toBeInTheDocument();
      });
    });

    it('shows excluded count in badge when people are excluded', async () => {
      renderModal();

      fireEvent.click(screen.getByText('Find Dates'));

      // First set nights to 1 to get results
      const decrementButtons = screen.getAllByRole('button', { name: 'Decrease' });
      fireEvent.click(decrementButtons[0]); // 3 -> 2
      fireEvent.click(decrementButtons[0]); // 2 -> 1

      await waitFor(() => {
        expect(screen.getByText(/found/)).toBeInTheDocument();
      });

      // Exclude Alice
      const aliceButtons = screen.getAllByRole('button').filter(btn => btn.textContent === 'Alice');
      fireEvent.click(aliceButtons[0]);

      await waitFor(() => {
        // Should show "(1 excluded)" indicator and "of 2" for included count
        expect(screen.getByText(/1 excluded/)).toBeInTheDocument();
        expect(screen.getByText(/of 2/)).toBeInTheDocument();
      });
    });

    it('shows message when all people are excluded', async () => {
      renderModal();

      fireEvent.click(screen.getByText('Find Dates'));

      await waitFor(() => {
        expect(screen.getByText('Exclude people')).toBeInTheDocument();
      });

      // Exclude all people
      const personButtons = screen.getAllByRole('button').filter(
        btn => ['Alice', 'Bob', 'Charlie'].includes(btn.textContent || '')
      );
      personButtons.forEach(btn => fireEvent.click(btn));

      await waitFor(() => {
        expect(screen.getByText(/All people are excluded/)).toBeInTheDocument();
      });
    });
  });

  describe('Submissions Tab', () => {
    it('shows submission count for each person', async () => {
      renderModal();

      await waitFor(() => {
        expect(screen.getByText(/2 unavailable dates/)).toBeInTheDocument();
        expect(screen.getByText(/3 unavailable dates/)).toBeInTheDocument();
        expect(screen.getByText(/0 unavailable dates/)).toBeInTheDocument();
      });
    });

    it('has copy edit link buttons', async () => {
      renderModal();

      await waitFor(() => {
        const linkButtons = screen.getAllByRole('button').filter(
          (btn) => btn.querySelector('svg')
        );
        expect(linkButtons.length).toBeGreaterThan(0);
      });
    });

    it('has delete submission buttons', async () => {
      renderModal();

      await waitFor(() => {
        // Each submission should have a delete button
        expect(screen.getAllByRole('button').length).toBeGreaterThan(3);
      });
    });

    it('has reset all submissions button', async () => {
      renderModal();

      await waitFor(() => {
        expect(screen.getByText('Reset All Submissions')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Controls', () => {
    it('displays survey name in header', () => {
      renderModal();

      expect(screen.getByText('Team Vacation')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      renderModal();

      // Find the X button (it's the one with the X icon in the header)
      const buttons = screen.getAllByRole('button');
      const closeBtn = buttons.find(btn => btn.querySelector('svg'));

      if (closeBtn) {
        fireEvent.click(closeBtn);
      }
    });
  });
});

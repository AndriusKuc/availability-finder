import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Calendar } from '@/components/Calendar';

describe('Calendar', () => {
  const defaultProps = {
    selectedDates: new Set<string>(),
    onToggleDate: vi.fn(),
    currentDate: new Date('2025-06-15'),
    onPrevMonth: vi.fn(),
    onNextMonth: vi.fn(),
    monthYear: 'June 2025',
  };

  it('renders month and year', () => {
    render(<Calendar {...defaultProps} />);
    expect(screen.getByText('June 2025')).toBeInTheDocument();
  });

  it('renders day headers starting from Monday', () => {
    render(<Calendar {...defaultProps} />);
    const headers = screen.getAllByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/);
    expect(headers).toHaveLength(7);
    // Check order: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    expect(headers[0]).toHaveTextContent('Mon');
    expect(headers[1]).toHaveTextContent('Tue');
    expect(headers[2]).toHaveTextContent('Wed');
    expect(headers[3]).toHaveTextContent('Thu');
    expect(headers[4]).toHaveTextContent('Fri');
    expect(headers[5]).toHaveTextContent('Sat');
    expect(headers[6]).toHaveTextContent('Sun');
  });

  it('renders days of the month', () => {
    render(<Calendar {...defaultProps} />);
    // June has 30 days
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('calls onPrevMonth when previous button is clicked', () => {
    const onPrevMonth = vi.fn();
    render(<Calendar {...defaultProps} onPrevMonth={onPrevMonth} />);

    fireEvent.click(screen.getByLabelText('Previous month'));
    expect(onPrevMonth).toHaveBeenCalledTimes(1);
  });

  it('calls onNextMonth when next button is clicked', () => {
    const onNextMonth = vi.fn();
    render(<Calendar {...defaultProps} onNextMonth={onNextMonth} />);

    fireEvent.click(screen.getByLabelText('Next month'));
    expect(onNextMonth).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleDate when a day is clicked', () => {
    const onToggleDate = vi.fn();
    render(<Calendar {...defaultProps} onToggleDate={onToggleDate} />);

    fireEvent.mouseDown(screen.getByText('15'));
    expect(onToggleDate).toHaveBeenCalledWith('2025-06-15');
  });

  it('does not call onToggleDate in readOnly mode', () => {
    const onToggleDate = vi.fn();
    render(<Calendar {...defaultProps} onToggleDate={onToggleDate} readOnly />);

    fireEvent.mouseDown(screen.getByText('15'));
    expect(onToggleDate).not.toHaveBeenCalled();
  });

  it('respects minDate boundary', () => {
    const onToggleDate = vi.fn();
    render(
      <Calendar
        {...defaultProps}
        onToggleDate={onToggleDate}
        minDate="2025-06-10"
      />
    );

    // Day before minDate should be disabled
    const day5 = screen.getByText('5');
    expect(day5).toHaveClass('cursor-not-allowed');

    fireEvent.mouseDown(day5);
    expect(onToggleDate).not.toHaveBeenCalled();
  });

  it('respects maxDate boundary', () => {
    const onToggleDate = vi.fn();
    render(
      <Calendar
        {...defaultProps}
        onToggleDate={onToggleDate}
        maxDate="2025-06-20"
      />
    );

    // Day after maxDate should be disabled
    const day25 = screen.getByText('25');
    expect(day25).toHaveClass('cursor-not-allowed');

    fireEvent.mouseDown(day25);
    expect(onToggleDate).not.toHaveBeenCalled();
  });

  it('disables previous button when at minDate boundary', () => {
    render(
      <Calendar
        {...defaultProps}
        minDate="2025-06-01"
      />
    );

    const prevButton = screen.getByLabelText('Previous month');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button when at maxDate boundary', () => {
    render(
      <Calendar
        {...defaultProps}
        maxDate="2025-06-30"
      />
    );

    const nextButton = screen.getByLabelText('Next month');
    expect(nextButton).toBeDisabled();
  });

  it('shows selected dates with appropriate styling', () => {
    const selectedDates = new Set(['2025-06-15']);
    render(<Calendar {...defaultProps} selectedDates={selectedDates} />);

    const day15 = screen.getByText('15');
    expect(day15).toHaveClass('bg-primary');
  });

  it('renders heatmap when heatmapData is provided', () => {
    const heatmapData = { '2025-06-15': 3 };
    render(
      <Calendar
        {...defaultProps}
        heatmapData={heatmapData}
        totalParticipants={5}
      />
    );

    // Should show the heatmap legend
    expect(screen.getByText('All available')).toBeInTheDocument();
    expect(screen.getByText('All unavailable')).toBeInTheDocument();
  });

  it('shows availability count in heatmap cells', () => {
    const heatmapData = { '2025-06-15': 2 };
    const heatmapNames = { '2025-06-15': ['Alice', 'Bob'] };
    render(
      <Calendar
        {...defaultProps}
        heatmapData={heatmapData}
        heatmapNames={heatmapNames}
        totalParticipants={5}
      />
    );

    const dayWithData = screen.getByTestId('day-with-tooltip-15');
    // Should show 3 available (green) and 2 unavailable (red)
    expect(dayWithData).toHaveTextContent('3');
    expect(dayWithData).toHaveTextContent('2');
  });

  it('shows unavailable names directly in heatmap cells', () => {
    const heatmapData = { '2025-06-15': 2 };
    const heatmapNames = { '2025-06-15': ['Alice', 'Bob'] };
    render(
      <Calendar
        {...defaultProps}
        heatmapData={heatmapData}
        heatmapNames={heatmapNames}
        totalParticipants={5}
      />
    );

    const dayWithData = screen.getByTestId('day-with-tooltip-15');
    expect(dayWithData).toHaveTextContent('Alice');
    expect(dayWithData).toHaveTextContent('Bob');
  });

  it('truncates names when more than 2 unavailable', () => {
    const heatmapData = { '2025-06-15': 4 };
    const heatmapNames = { '2025-06-15': ['Alice', 'Bob', 'Charlie', 'David'] };
    render(
      <Calendar
        {...defaultProps}
        heatmapData={heatmapData}
        heatmapNames={heatmapNames}
        totalParticipants={5}
      />
    );

    const dayWithData = screen.getByTestId('day-with-tooltip-15');
    // Should show first 2 names and "+2" for remaining
    expect(dayWithData).toHaveTextContent('Alice');
    expect(dayWithData).toHaveTextContent('Bob');
    expect(dayWithData).toHaveTextContent('+2');
  });

  it('shows Today button when not on current month and onToday is provided', () => {
    const onToday = vi.fn();
    // June 2025 is not the current month (today is Feb 2026)
    render(<Calendar {...defaultProps} onToday={onToday} />);

    const todayButton = screen.getByLabelText('Go to today');
    expect(todayButton).toBeInTheDocument();
  });

  it('hides Today button when already on current month', () => {
    const onToday = vi.fn();
    const today = new Date();
    const monthYear = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    render(
      <Calendar
        {...defaultProps}
        currentDate={today}
        monthYear={monthYear}
        onToday={onToday}
      />
    );

    expect(screen.queryByLabelText('Go to today')).not.toBeInTheDocument();
  });

  it('calls onToday when Today button is clicked', () => {
    const onToday = vi.fn();
    render(<Calendar {...defaultProps} onToday={onToday} />);

    fireEvent.click(screen.getByLabelText('Go to today'));
    expect(onToday).toHaveBeenCalledTimes(1);
  });

  it('does not show Today button when onToday is not provided', () => {
    render(<Calendar {...defaultProps} />);
    expect(screen.queryByLabelText('Go to today')).not.toBeInTheDocument();
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DatePicker } from '@/components/ui/DatePicker';

describe('DatePicker', () => {
  const getMainButton = () => screen.getAllByRole('button')[0];

  it('renders with placeholder when no value', () => {
    render(<DatePicker value="" onChange={() => {}} placeholder="Select date" />);
    expect(screen.getByText('Select date')).toBeInTheDocument();
  });

  it('displays formatted date when value is set', () => {
    render(<DatePicker value="2025-06-15" onChange={() => {}} />);
    expect(screen.getByText('Jun 15, 2025')).toBeInTheDocument();
  });

  it('opens calendar dropdown when clicked', () => {
    render(<DatePicker value="" onChange={() => {}} />);

    fireEvent.click(getMainButton());

    // Should show day headers starting from Monday
    const headers = screen.getAllByText(/^(Mo|Tu|We|Th|Fr|Sa|Su)$/);
    expect(headers).toHaveLength(7);
    expect(headers[0]).toHaveTextContent('Mo');
    expect(headers[6]).toHaveTextContent('Su');
  });

  it('calls onChange when a date is selected', () => {
    const handleChange = vi.fn();
    render(<DatePicker value="2025-06-15" onChange={handleChange} />);

    // Open the picker
    fireEvent.click(getMainButton());

    // Click on day 20
    fireEvent.click(screen.getByText('20'));

    expect(handleChange).toHaveBeenCalledWith('2025-06-20');
  });

  it('closes dropdown after selecting a date', () => {
    render(<DatePicker value="2025-06-15" onChange={() => {}} />);

    // Open the picker
    fireEvent.click(getMainButton());
    expect(screen.getByText('Mo')).toBeInTheDocument();

    // Click on a day
    fireEvent.click(screen.getByText('20'));

    // Dropdown should be closed (day headers not visible)
    expect(screen.queryByText('Mo')).not.toBeInTheDocument();
  });

  it('navigates to previous month', () => {
    render(<DatePicker value="2025-06-15" onChange={() => {}} />);

    fireEvent.click(getMainButton());
    expect(screen.getByText('June 2025')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Previous month'));
    expect(screen.getByText('May 2025')).toBeInTheDocument();
  });

  it('navigates to next month', () => {
    render(<DatePicker value="2025-06-15" onChange={() => {}} />);

    fireEvent.click(getMainButton());
    expect(screen.getByText('June 2025')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Next month'));
    expect(screen.getByText('July 2025')).toBeInTheDocument();
  });

  it('disables dates before min date', () => {
    render(<DatePicker value="" onChange={() => {}} min="2025-06-15" />);

    fireEvent.click(getMainButton());

    // Day 10 should be disabled (before min date of 15th)
    const day10 = screen.getByText('10');
    expect(day10).toBeDisabled();
  });

  it('disables dates after max date', () => {
    render(<DatePicker value="" onChange={() => {}} max="2025-06-15" />);

    fireEvent.click(getMainButton());

    // Day 20 should be disabled (after max date of 15th)
    const day20 = screen.getByText('20');
    expect(day20).toBeDisabled();
  });

  it('can be disabled', () => {
    render(<DatePicker value="" onChange={() => {}} disabled />);
    expect(getMainButton()).toBeDisabled();
  });

  it('clears value when Clear button is clicked', () => {
    const handleChange = vi.fn();
    render(<DatePicker value="2025-06-15" onChange={handleChange} />);

    fireEvent.click(getMainButton());
    fireEvent.click(screen.getByText('Clear'));

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('renders calendar icon', () => {
    const { container } = render(<DatePicker value="" onChange={() => {}} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('highlights selected date', () => {
    render(<DatePicker value="2025-06-15" onChange={() => {}} />);

    fireEvent.click(getMainButton());

    const day15 = screen.getByText('15');
    expect(day15).toHaveClass('bg-primary');
  });
});

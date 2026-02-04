import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DatePicker } from '@/components/ui/DatePicker';

describe('DatePicker', () => {
  it('renders with placeholder when no value', () => {
    render(<DatePicker value="" onChange={() => {}} placeholder="Select date" />);
    expect(screen.getByText('Select date')).toBeInTheDocument();
  });

  it('displays formatted date when value is set', () => {
    render(<DatePicker value="2025-06-15" onChange={() => {}} />);
    expect(screen.getByText('Jun 15, 2025')).toBeInTheDocument();
  });

  it('calls onChange when date is selected', () => {
    const handleChange = vi.fn();
    render(<DatePicker value="" onChange={handleChange} />);

    const input = screen.getByLabelText('Select date');
    fireEvent.change(input, { target: { value: '2025-07-20' } });

    expect(handleChange).toHaveBeenCalledWith('2025-07-20');
  });

  it('applies min constraint to input', () => {
    render(<DatePicker value="" onChange={() => {}} min="2025-01-01" />);
    const input = screen.getByLabelText('Select date');
    expect(input).toHaveAttribute('min', '2025-01-01');
  });

  it('applies max constraint to input', () => {
    render(<DatePicker value="" onChange={() => {}} max="2025-12-31" />);
    const input = screen.getByLabelText('Select date');
    expect(input).toHaveAttribute('max', '2025-12-31');
  });

  it('can be disabled', () => {
    render(<DatePicker value="" onChange={() => {}} disabled />);
    const input = screen.getByLabelText('Select date');
    expect(input).toBeDisabled();
  });

  it('uses custom placeholder', () => {
    render(<DatePicker value="" onChange={() => {}} placeholder="Pick a date" />);
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('renders calendar icon', () => {
    const { container } = render(<DatePicker value="" onChange={() => {}} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NumberStepper } from '@/components/ui/NumberStepper';

describe('NumberStepper', () => {
  it('renders with initial value', () => {
    render(<NumberStepper value={5} onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('5');
  });

  it('renders with label', () => {
    render(<NumberStepper value={3} onChange={() => {}} label="nights" />);
    expect(screen.getByText('nights')).toBeInTheDocument();
  });

  it('increments value when plus button is clicked', () => {
    const handleChange = vi.fn();
    render(<NumberStepper value={5} onChange={handleChange} />);

    fireEvent.click(screen.getByLabelText('Increase'));
    expect(handleChange).toHaveBeenCalledWith(6);
  });

  it('decrements value when minus button is clicked', () => {
    const handleChange = vi.fn();
    render(<NumberStepper value={5} onChange={handleChange} />);

    fireEvent.click(screen.getByLabelText('Decrease'));
    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it('respects min value', () => {
    const handleChange = vi.fn();
    render(<NumberStepper value={1} onChange={handleChange} min={1} />);

    const decreaseButton = screen.getByLabelText('Decrease');
    expect(decreaseButton).toBeDisabled();

    fireEvent.click(decreaseButton);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('respects max value', () => {
    const handleChange = vi.fn();
    render(<NumberStepper value={10} onChange={handleChange} max={10} />);

    const increaseButton = screen.getByLabelText('Increase');
    expect(increaseButton).toBeDisabled();

    fireEvent.click(increaseButton);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('uses custom step value for increment', () => {
    const handleChange = vi.fn();
    render(<NumberStepper value={5} onChange={handleChange} step={5} />);

    fireEvent.click(screen.getByLabelText('Increase'));
    expect(handleChange).toHaveBeenCalledWith(10);
  });

  it('uses custom step value for decrement', () => {
    const handleChange = vi.fn();
    render(<NumberStepper value={10} onChange={handleChange} step={5} />);

    fireEvent.click(screen.getByLabelText('Decrease'));
    expect(handleChange).toHaveBeenCalledWith(5);
  });

  it('allows direct input of valid value', () => {
    const handleChange = vi.fn();
    render(<NumberStepper value={5} onChange={handleChange} min={1} max={20} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '15' } });

    expect(handleChange).toHaveBeenCalledWith(15);
  });

  it('ignores invalid direct input', () => {
    const handleChange = vi.fn();
    render(<NumberStepper value={5} onChange={handleChange} min={1} max={10} />);

    const input = screen.getByRole('textbox');

    // Value above max
    fireEvent.change(input, { target: { value: '50' } });
    expect(handleChange).not.toHaveBeenCalled();

    // Non-numeric value
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('renders decrease and increase buttons', () => {
    render(<NumberStepper value={5} onChange={() => {}} />);

    expect(screen.getByLabelText('Decrease')).toBeInTheDocument();
    expect(screen.getByLabelText('Increase')).toBeInTheDocument();
  });

  it('enables both buttons when value is in middle of range', () => {
    render(<NumberStepper value={5} onChange={() => {}} min={1} max={10} />);

    expect(screen.getByLabelText('Decrease')).not.toBeDisabled();
    expect(screen.getByLabelText('Increase')).not.toBeDisabled();
  });
});

import { useRef } from 'react';
import { CalendarDays } from '@/components/icons';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'Select date',
  disabled = false,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDisplayValue = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleContainerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.showPicker();
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`
        relative flex items-center gap-3 px-4 py-3
        bg-white border border-gray-300 rounded-xl
        transition-all duration-200
        ${disabled
          ? 'bg-gray-100 cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:border-primary hover:shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
        }
      `}
    >
      <CalendarDays className="w-5 h-5 text-gray-400 shrink-0" />
      <span className={`flex-1 text-left ${value ? 'text-gray-900' : 'text-gray-400'}`}>
        {value ? formatDisplayValue(value) : placeholder}
      </span>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        disabled={disabled}
        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        aria-label={placeholder}
      />
    </div>
  );
}

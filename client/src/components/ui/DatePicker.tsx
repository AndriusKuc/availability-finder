import { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from '@/components/icons';

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
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + 'T00:00:00');
    if (min) return new Date(min + 'T00:00:00');
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update view when value changes externally
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + 'T00:00:00'));
    }
  }, [value]);

  const formatDisplayValue = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isDateDisabled = (dateStr: string): boolean => {
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  const handleDateClick = (dateStr: string) => {
    if (isDateDisabled(dateStr)) return;
    onChange(dateStr);
    setIsOpen(false);
  };

  const prevMonth = () => {
    setViewDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const nextMonth = () => {
    setViewDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  // Generate calendar days
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const monthYear = viewDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const days: { date: string; day: number; disabled: boolean; isSelected: boolean; isToday: boolean }[] = [];
  const today = formatDateString(new Date());

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = formatDateString(date);
    days.push({
      date: dateStr,
      day,
      disabled: isDateDisabled(dateStr),
      isSelected: dateStr === value,
      isToday: dateStr === today,
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center gap-3 px-4 py-3
          bg-white border border-gray-300 rounded-xl
          text-left transition-all duration-200
          ${disabled
            ? 'bg-gray-100 cursor-not-allowed opacity-60'
            : 'cursor-pointer hover:border-primary hover:shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
          }
          ${isOpen ? 'border-primary ring-2 ring-primary/20' : ''}
        `}
      >
        <CalendarDays className="w-5 h-5 text-gray-400 shrink-0" />
        <span className={`flex-1 ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value ? formatDisplayValue(value) : placeholder}
        </span>
        <ChevronRight
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-4 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-semibold text-gray-800">{monthYear}</span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span
                key={d}
                className="text-center text-xs font-semibold text-gray-400 py-1"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before first of month */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days */}
            {days.map(({ date, day, disabled, isSelected, isToday }) => (
              <button
                key={date}
                type="button"
                onClick={() => handleDateClick(date)}
                disabled={disabled}
                className={`
                  aspect-square flex items-center justify-center text-sm font-medium rounded-lg
                  transition-all duration-150
                  ${disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : isSelected
                    ? 'bg-primary text-white'
                    : isToday
                    ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                const todayStr = formatDateString(new Date());
                if (!isDateDisabled(todayStr)) {
                  onChange(todayStr);
                  setIsOpen(false);
                }
              }}
              disabled={isDateDisabled(today)}
              className="flex-1 text-xs font-medium text-primary hover:bg-primary/10 py-2 rounded-lg transition-colors disabled:text-gray-300 disabled:hover:bg-transparent"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="flex-1 text-xs font-medium text-gray-500 hover:bg-gray-100 py-2 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

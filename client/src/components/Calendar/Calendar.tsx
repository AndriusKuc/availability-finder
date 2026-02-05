import { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { ChevronLeft, ChevronRight } from '@/components/icons';

interface CalendarProps {
  selectedDates: Set<string>;
  onToggleDate: (date: string) => void;
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday?: () => void;
  monthYear: string;
  minDate?: string;
  maxDate?: string;
  heatmapData?: Record<string, number>;
  heatmapNames?: Record<string, string[]>;
  totalParticipants?: number;
  readOnly?: boolean;
  onDateClick?: (date: string) => void;
  highlightedDate?: string;
}

export function Calendar({
  selectedDates,
  onToggleDate,
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  monthYear,
  minDate,
  maxDate,
  heatmapData,
  heatmapNames,
  totalParticipants = 0,
  readOnly = false,
  onDateClick,
  highlightedDate,
}: CalendarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragModeRef = useRef<'select' | 'deselect' | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Convert Sunday-based (0-6) to Monday-based (0-6)
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  // Check if current view is showing today's month
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const formatDate = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const isDateInRange = (date: string): boolean => {
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return true;
  };

  // Check if we can navigate to previous/next month
  const canGoPrev = !minDate || (() => {
    const prevMonth = new Date(year, month - 1, 1);
    const prevMonthEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
    const prevMonthEndStr = `${prevMonthEnd.getFullYear()}-${String(prevMonthEnd.getMonth() + 1).padStart(2, '0')}-${String(prevMonthEnd.getDate()).padStart(2, '0')}`;
    return prevMonthEndStr >= minDate;
  })();

  const canGoNext = !maxDate || (() => {
    const nextMonth = new Date(year, month + 1, 1);
    const nextMonthStartStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
    return nextMonthStartStr <= maxDate;
  })();

  const handleDayMouseDown = useCallback(
    (date: string) => {
      if (readOnly || !isDateInRange(date)) return;
      setIsDragging(true);
      dragModeRef.current = selectedDates.has(date) ? 'deselect' : 'select';
      onToggleDate(date);
    },
    [readOnly, selectedDates, onToggleDate, minDate, maxDate]
  );

  const handleDayMouseEnter = useCallback(
    (date: string) => {
      if (!isDragging || readOnly || !isDateInRange(date)) return;
      const isSelected = selectedDates.has(date);
      if (dragModeRef.current === 'select' && !isSelected) {
        onToggleDate(date);
      } else if (dragModeRef.current === 'deselect' && isSelected) {
        onToggleDate(date);
      }
    },
    [isDragging, readOnly, selectedDates, onToggleDate, minDate, maxDate]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragModeRef.current = null;
  }, []);

  const getIntensity = (date: string): number => {
    if (!heatmapData || totalParticipants === 0) return 0;
    const count = heatmapData[date] || 0;
    return Math.round((count / totalParticipants) * 10);
  };

  const days = [];

  for (let i = 0; i < startDay; i++) {
    days.push(
      <div key={`empty-${i}`} className="aspect-square" />
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDate(day);
    const isSelected = selectedDates.has(date);
    const intensity = heatmapData ? getIntensity(date) : 0;
    const names = heatmapNames?.[date] || [];
    const inRange = isDateInRange(date);
    const availableCount = totalParticipants - names.length;

    // For heatmap mode, use a different layout
    if (heatmapData && inRange) {
      const isHighlighted = highlightedDate === date;
      const cellClass = `intensity-${intensity} p-1 flex flex-col items-center justify-start select-none transition-all duration-200 cursor-pointer min-h-[70px] ${
        isHighlighted
          ? 'ring-2 ring-gray-800 ring-inset'
          : 'hover:ring-2 hover:ring-gray-400 hover:ring-inset'
      }`;

      days.push(
        <div
          key={date}
          className={cellClass}
          onClick={() => onDateClick?.(date)}
          data-testid={names.length > 0 ? `day-with-tooltip-${day}` : undefined}
        >
          <div className="text-sm font-semibold text-gray-800">{day}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-bold text-green-700">{availableCount}</span>
            <span className="text-[10px] text-gray-400">/</span>
            <span className="text-[10px] font-bold text-red-600">{names.length}</span>
          </div>
          {names.length > 0 && (
            <div className="text-[9px] text-red-600 text-center leading-tight mt-0.5 overflow-hidden max-h-[28px]">
              {names.slice(0, 2).map((name, i) => (
                <div key={i} className="truncate max-w-[50px]">{name}</div>
              ))}
              {names.length > 2 && (
                <div className="text-gray-500">+{names.length - 2}</div>
              )}
            </div>
          )}
        </div>
      );
      continue;
    }

    // Standard mode (non-heatmap)
    let className =
      'aspect-square flex items-center justify-center text-sm font-medium select-none transition-all duration-200';

    if (!inRange) {
      className += ' text-gray-300 cursor-not-allowed';
    } else if (isSelected) {
      className += ' bg-primary text-white hover:bg-primary-dark cursor-pointer';
    } else {
      className += ' hover:bg-beige-light cursor-pointer';
    }

    const dayContent = (
      <div
        className={className}
        onMouseDown={() => inRange && handleDayMouseDown(date)}
        onMouseEnter={() => inRange && handleDayMouseEnter(date)}
        onMouseUp={handleMouseUp}
      >
        {day}
      </div>
    );

    days.push(
      <div key={date} className="relative">
        {dayContent}
      </div>
    );
  }

  return (
    <div className="my-6" onMouseLeave={handleMouseUp}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <Button
            variant="icon"
            size="sm"
            onClick={onPrevMonth}
            disabled={!canGoPrev}
            aria-label="Previous month"
          >
            <ChevronLeft />
          </Button>
          {onToday && !isCurrentMonth && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onToday}
              aria-label="Go to today"
            >
              Today
            </Button>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{monthYear}</h3>
        <Button
          variant="icon"
          size="sm"
          onClick={onNextMonth}
          disabled={!canGoNext}
          aria-label="Next month"
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <span
              key={d}
              className="py-3 text-center text-xs font-semibold text-gray-500 uppercase"
            >
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">{days}</div>
      </div>

      {heatmapData && (
        <div className="flex items-center justify-center gap-3 mt-4 text-xs text-gray-600">
          <span>All available</span>
          <div className="w-36 h-3 rounded-md bg-gradient-to-r from-green-100 via-orange-200 to-primary" />
          <span>All unavailable</span>
        </div>
      )}
    </div>
  );
}

import { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { ChevronLeft, ChevronRight } from '@/components/icons';

interface CalendarProps {
  selectedDates: Set<string>;
  onToggleDate: (date: string) => void;
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  monthYear: string;
  heatmapData?: Record<string, number>;
  heatmapNames?: Record<string, string[]>;
  totalParticipants?: number;
  readOnly?: boolean;
}

export function Calendar({
  selectedDates,
  onToggleDate,
  currentDate,
  onPrevMonth,
  onNextMonth,
  monthYear,
  heatmapData,
  heatmapNames,
  totalParticipants = 0,
  readOnly = false,
}: CalendarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragModeRef = useRef<'select' | 'deselect' | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const formatDate = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const handleDayMouseDown = useCallback(
    (date: string) => {
      if (readOnly) return;
      setIsDragging(true);
      dragModeRef.current = selectedDates.has(date) ? 'deselect' : 'select';
      onToggleDate(date);
    },
    [readOnly, selectedDates, onToggleDate]
  );

  const handleDayMouseEnter = useCallback(
    (date: string) => {
      if (!isDragging || readOnly) return;
      const isSelected = selectedDates.has(date);
      if (dragModeRef.current === 'select' && !isSelected) {
        onToggleDate(date);
      } else if (dragModeRef.current === 'deselect' && isSelected) {
        onToggleDate(date);
      }
    },
    [isDragging, readOnly, selectedDates, onToggleDate]
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

    let className =
      'aspect-square flex items-center justify-center text-sm font-medium select-none transition-all duration-200';

    if (heatmapData) {
      className += ` intensity-${intensity}`;
    } else if (isSelected) {
      className += ' bg-primary text-white hover:bg-primary-dark cursor-pointer';
    } else {
      className += ' hover:bg-beige-light cursor-pointer';
    }

    days.push(
      <div
        key={date}
        className={className}
        title={names.length > 0 ? `Unavailable: ${names.join(', ')}` : undefined}
        onMouseDown={() => handleDayMouseDown(date)}
        onMouseEnter={() => handleDayMouseEnter(date)}
        onMouseUp={handleMouseUp}
      >
        {day}
      </div>
    );
  }

  return (
    <div className="my-6" onMouseLeave={handleMouseUp}>
      <div className="flex items-center justify-between mb-4">
        <Button variant="icon" size="sm" onClick={onPrevMonth} aria-label="Previous month">
          <ChevronLeft />
        </Button>
        <h3 className="text-lg font-semibold text-gray-800">{monthYear}</h3>
        <Button variant="icon" size="sm" onClick={onNextMonth} aria-label="Next month">
          <ChevronRight />
        </Button>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
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

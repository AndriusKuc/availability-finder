import { useState, useCallback } from 'react';

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  const formatDate = useCallback((year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }, []);

  const toggleDate = useCallback((date: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }, []);

  const prevMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  }, []);

  const getMonthData = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return {
      year,
      month,
      startDay: firstDay.getDay(),
      daysInMonth: lastDay.getDate(),
      monthYear: currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      }),
    };
  }, [currentDate]);

  const getSelectedArray = useCallback(() => {
    return Array.from(selectedDates).sort();
  }, [selectedDates]);

  const clearSelection = useCallback(() => {
    setSelectedDates(new Set());
  }, []);

  return {
    currentDate,
    selectedDates,
    formatDate,
    toggleDate,
    prevMonth,
    nextMonth,
    getMonthData,
    getSelectedArray,
    clearSelection,
  };
}

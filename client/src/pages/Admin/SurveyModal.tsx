import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Input } from '@/components/ui';
import { Calendar } from '@/components/Calendar';
import { X, Trash } from '@/components/icons';
import { adminApi } from '@/services/api';
import type { Submission, SurveyWithCount, DateRange } from '@/types';

interface SurveyModalProps {
  survey: SurveyWithCount;
  onClose: () => void;
  onUpdate: () => void;
}

type Tab = 'submissions' | 'calendar' | 'summary';

export function SurveyModal({ survey, onClose, onUpdate }: SurveyModalProps) {
  const [tab, setTab] = useState<Tab>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [nightCount, setNightCount] = useState(3);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSubmissions(survey.id);
      setSubmissions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [survey.id]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleDeleteSubmission = async (id: number) => {
    if (!confirm('Delete this submission?')) return;
    await adminApi.deleteSubmission(id);
    loadSubmissions();
    onUpdate();
  };

  const handleResetAll = async () => {
    if (!confirm('Delete ALL submissions for this survey?')) return;
    await adminApi.resetSubmissions(survey.id);
    loadSubmissions();
    onUpdate();
  };

  // Heatmap data
  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    const names: Record<string, string[]> = {};

    submissions.forEach((sub) => {
      sub.unavailable_dates.forEach((date) => {
        data[date] = (data[date] || 0) + 1;
        if (!names[date]) names[date] = [];
        names[date].push(sub.person_name);
      });
    });

    return { counts: data, names };
  }, [submissions]);

  // Find available date ranges
  const availableRanges = useMemo(() => {
    if (submissions.length === 0) return [];

    const unavailableDates = new Set<string>();
    submissions.forEach((sub) => {
      sub.unavailable_dates.forEach((date) => unavailableDates.add(date));
    });

    const today = new Date();
    const endDate = new Date(today);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const ranges: DateRange[] = [];
    let currentRange: DateRange | null = null;

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(d);
      const isAvailable = !unavailableDates.has(dateStr);

      if (isAvailable) {
        if (!currentRange) {
          currentRange = { start: dateStr, end: dateStr, nights: 1 };
        } else {
          currentRange.end = dateStr;
          currentRange.nights++;
        }
      } else {
        if (currentRange && currentRange.nights >= nightCount) {
          ranges.push({ ...currentRange });
        }
        currentRange = null;
      }
    }

    if (currentRange && currentRange.nights >= nightCount) {
      ranges.push(currentRange);
    }

    return ranges;
  }, [submissions, nightCount]);

  const prevMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const nextMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const monthYear = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{survey.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X />
          </button>
        </div>

        <div className="flex border-b border-gray-200 px-6">
          {(['submissions', 'calendar', 'summary'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'text-primary border-primary'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {t === 'submissions'
                ? 'Submissions'
                : t === 'calendar'
                ? 'Merged Calendar'
                : 'Find Dates'}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {tab === 'submissions' && (
            <div>
              <div className="mb-4">
                <Button variant="danger" size="sm" onClick={handleResetAll}>
                  Reset All Submissions
                </Button>
              </div>

              {loading ? (
                <p className="text-gray-500 text-center py-8">Loading...</p>
              ) : submissions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No submissions yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {sub.person_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(sub.created_at).toLocaleDateString()} •{' '}
                          {sub.unavailable_dates.length} unavailable dates
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteSubmission(sub.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'calendar' && (
            <div>
              <Calendar
                selectedDates={new Set()}
                onToggleDate={() => {}}
                currentDate={currentDate}
                onPrevMonth={prevMonth}
                onNextMonth={nextMonth}
                monthYear={monthYear}
                heatmapData={heatmapData.counts}
                heatmapNames={heatmapData.names}
                totalParticipants={submissions.length}
                readOnly
              />
            </div>
          )}

          {tab === 'summary' && (
            <div>
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">
                  Find consecutive nights where everyone is available:
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    value={nightCount}
                    onChange={(e) => setNightCount(Number(e.target.value) || 1)}
                    className="w-20 text-center"
                  />
                  <span className="text-gray-600">nights</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                {submissions.length === 0 ? (
                  <p className="text-gray-500 text-center">
                    No submissions to analyze.
                  </p>
                ) : availableRanges.length === 0 ? (
                  <p className="text-gray-500 text-center">
                    No {nightCount}+ night periods found where everyone is
                    available.
                  </p>
                ) : (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-4">
                      Available {nightCount}+ night periods ({availableRanges.length}{' '}
                      found):
                    </h4>
                    <div className="space-y-3">
                      {availableRanges.map((range, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                        >
                          <span className="font-medium text-gray-900">
                            {formatDisplayDate(range.start)} –{' '}
                            {formatDisplayDate(range.end)}
                          </span>
                          <span className="text-sm font-semibold text-success">
                            {range.nights} nights
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

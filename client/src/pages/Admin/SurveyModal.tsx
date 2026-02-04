import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, NumberStepper } from '@/components/ui';
import { Calendar } from '@/components/Calendar';
import { X, Trash } from '@/components/icons';
import { adminApi } from '@/services/api';
import type { Submission, SurveyWithCount, DateRange } from '@/types';

interface SurveyModalProps {
  survey: SurveyWithCount;
  onClose: () => void;
  onUpdate: () => void;
}

type Tab = 'submissions' | 'calendar' | 'individual' | 'summary';

export function SurveyModal({ survey, onClose, onUpdate }: SurveyModalProps) {
  const [tab, setTab] = useState<Tab>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [nightCount, setNightCount] = useState(3);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  // Calendar state - initialize to survey start date
  const [currentDate, setCurrentDate] = useState(
    () => new Date(survey.start_date + 'T00:00:00')
  );

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

  // Reset selected person when tab changes or submissions change
  useEffect(() => {
    if (submissions.length > 0 && !selectedPerson) {
      setSelectedPerson(submissions[0].person_name);
    }
  }, [submissions, selectedPerson]);

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

  // Heatmap data for merged calendar
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

  // Individual person's unavailable dates
  const individualDates = useMemo(() => {
    if (!selectedPerson) return new Set<string>();
    const person = submissions.find((s) => s.person_name === selectedPerson);
    return new Set(person?.unavailable_dates || []);
  }, [submissions, selectedPerson]);

  // Find available date ranges within the survey's date range
  const availableRanges = useMemo(() => {
    if (submissions.length === 0) return [];

    const unavailableDates = new Set<string>();
    submissions.forEach((sub) => {
      sub.unavailable_dates.forEach((date) => unavailableDates.add(date));
    });

    const startDate = new Date(survey.start_date + 'T00:00:00');
    const endDate = new Date(survey.end_date + 'T00:00:00');

    const ranges: DateRange[] = [];
    let currentRange: DateRange | null = null;

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
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
  }, [submissions, nightCount, survey.start_date, survey.end_date]);

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

  const goToToday = () => {
    setCurrentDate(new Date());
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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'submissions', label: 'Submissions' },
    { key: 'calendar', label: 'Merged Calendar' },
    { key: 'individual', label: 'Individual' },
    { key: 'summary', label: 'Find Dates' },
  ];

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

        <div className="flex border-b border-gray-200 px-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'text-primary border-primary'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {t.label}
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
              <p className="text-sm text-gray-500 mb-4">
                Hover over dates to see who is unavailable
              </p>
              <Calendar
                selectedDates={new Set()}
                onToggleDate={() => {}}
                currentDate={currentDate}
                onPrevMonth={prevMonth}
                onNextMonth={nextMonth}
                onToday={goToToday}
                monthYear={monthYear}
                minDate={survey.start_date}
                maxDate={survey.end_date}
                heatmapData={heatmapData.counts}
                heatmapNames={heatmapData.names}
                totalParticipants={submissions.length}
                readOnly
              />
            </div>
          )}

          {tab === 'individual' && (
            <div>
              {submissions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No submissions yet.
                </p>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select person to view their availability:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {submissions.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setSelectedPerson(sub.person_name)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedPerson === sub.person_name
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {sub.person_name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedPerson && (
                    <>
                      <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">
                          Showing unavailable dates for
                        </span>
                        <span className="font-semibold text-gray-900">
                          {selectedPerson}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({individualDates.size} dates)
                        </span>
                      </div>

                      <Calendar
                        selectedDates={individualDates}
                        onToggleDate={() => {}}
                        currentDate={currentDate}
                        onPrevMonth={prevMonth}
                        onNextMonth={nextMonth}
                        onToday={goToToday}
                        monthYear={monthYear}
                        minDate={survey.start_date}
                        maxDate={survey.end_date}
                        readOnly
                      />

                      <div className="flex justify-center gap-8 mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-5 h-5 rounded border border-gray-300 bg-white" />
                          <span>Available</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-5 h-5 rounded bg-primary" />
                          <span>Unavailable</span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'summary' && (
            <div>
              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-3">
                  Find consecutive nights where everyone is available:
                </label>
                <NumberStepper
                  value={nightCount}
                  onChange={setNightCount}
                  min={1}
                  max={30}
                  label="nights"
                />
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

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, NumberStepper, Tooltip } from '@/components/ui';
import { Calendar } from '@/components/Calendar';
import { X, Trash, Link, ChevronRight, Moon, Users } from '@/components/icons';
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
  const [minAttendees, setMinAttendees] = useState<number | null>(null);
  const [excludeWeekends, setExcludeWeekends] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedRanges, setExpandedRanges] = useState<Set<number>>(new Set());

  // Calendar state - initialize to survey start date
  const [currentDate, setCurrentDate] = useState(
    () => new Date(survey.start_date + 'T00:00:00')
  );

  const copyEditLink = async (sub: Submission) => {
    const url = `${window.location.origin}/edit/${sub.edit_token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(sub.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleRangeExpanded = (index: number) => {
    setExpandedRanges((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Get attendees info for a date range
  const getAttendeesForRange = (range: DateRange) => {
    const canAttend: string[] = [];
    const cannotAttend: string[] = [];

    submissions.forEach((sub) => {
      // Check if person has any unavailable dates in this range
      const hasConflict = sub.unavailable_dates.some((date) => {
        return date >= range.start && date <= range.end;
      });

      if (hasConflict) {
        cannotAttend.push(sub.person_name);
      } else {
        canAttend.push(sub.person_name);
      }
    });

    return { canAttend, cannotAttend };
  };

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

    // Count unavailable people per date
    const unavailableCount: Record<string, number> = {};
    submissions.forEach((sub) => {
      sub.unavailable_dates.forEach((date) => {
        unavailableCount[date] = (unavailableCount[date] || 0) + 1;
      });
    });

    const startDate = new Date(survey.start_date + 'T00:00:00');
    const endDate = new Date(survey.end_date + 'T00:00:00');
    const requiredAttendees = minAttendees ?? submissions.length;

    const ranges: DateRange[] = [];
    let currentRange: DateRange | null = null;

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const isWeekend = (d: Date) => {
      const day = d.getDay();
      return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    };

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(d);

      // Skip weekends if excluded
      if (excludeWeekends && isWeekend(d)) {
        if (currentRange && currentRange.nights >= nightCount) {
          ranges.push({ ...currentRange });
        }
        currentRange = null;
        continue;
      }

      // Check if enough people are available
      const unavailable = unavailableCount[dateStr] || 0;
      const available = submissions.length - unavailable;
      const isAvailable = available >= requiredAttendees;

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
  }, [submissions, nightCount, minAttendees, excludeWeekends, survey.start_date, survey.end_date]);

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
                      <div className="flex items-center gap-2">
                        <Tooltip
                          content={copiedId === sub.id ? 'Copied!' : 'Copy edit link'}
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => copyEditLink(sub)}
                          >
                            <Link size={16} />
                          </Button>
                        </Tooltip>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteSubmission(sub.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
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
              <div className="flex flex-wrap items-end gap-6 mb-6">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                    <Moon size={16} className="text-gray-500" />
                    Min consecutive nights
                  </label>
                  <NumberStepper
                    value={nightCount}
                    onChange={setNightCount}
                    min={1}
                    max={30}
                    label="nights"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                    <Users size={16} className="text-gray-500" />
                    Min attendees
                  </label>
                  <NumberStepper
                    value={minAttendees ?? submissions.length}
                    onChange={setMinAttendees}
                    min={1}
                    max={submissions.length || 1}
                    label={`of ${submissions.length}`}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={excludeWeekends}
                    onChange={(e) => setExcludeWeekends(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Exclude weekends</span>
                </label>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                {submissions.length === 0 ? (
                  <p className="text-gray-500 text-center">
                    No submissions to analyze.
                  </p>
                ) : availableRanges.length === 0 ? (
                  <p className="text-gray-500 text-center">
                    No {nightCount}+ night periods found where at least{' '}
                    {minAttendees ?? submissions.length} people are available.
                  </p>
                ) : (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-4">
                      {nightCount}+ night periods with {minAttendees ?? submissions.length}+ attendees ({availableRanges.length}{' '}
                      found):
                    </h4>
                    <div className="space-y-3">
                      {availableRanges.map((range, i) => {
                        const isExpanded = expandedRanges.has(i);
                        const attendeesInfo = getAttendeesForRange(range);
                        const { canAttend, cannotAttend } = attendeesInfo;

                        return (
                          <div
                            key={i}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                          >
                            <button
                              onClick={() => toggleRangeExpanded(i)}
                              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <ChevronRight
                                  size={16}
                                  className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                />
                                <span className="font-medium text-gray-900">
                                  {formatDisplayDate(range.start)} –{' '}
                                  {formatDisplayDate(range.end)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-blue-700 bg-blue-50 rounded-full">
                                  <Users size={14} />
                                  {canAttend.length}/{submissions.length}
                                </span>
                                <span className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-success bg-green-50 rounded-full">
                                  <Moon size={14} />
                                  {range.nights}
                                </span>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="text-sm font-semibold text-success mb-2">
                                      Can attend ({canAttend.length})
                                    </h5>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      {canAttend.length > 0 ? (
                                        canAttend.map((name) => (
                                          <div key={name}>• {name}</div>
                                        ))
                                      ) : (
                                        <div className="text-gray-400 italic">None</div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-semibold text-red-500 mb-2">
                                      Cannot attend ({cannotAttend.length})
                                    </h5>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      {cannotAttend.length > 0 ? (
                                        cannotAttend.map((name) => (
                                          <div key={name}>• {name}</div>
                                        ))
                                      ) : (
                                        <div className="text-gray-400 italic">None</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
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

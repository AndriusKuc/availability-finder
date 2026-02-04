import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, Button } from '@/components/ui';
import { Calendar } from '@/components/Calendar';
import { ChevronLeft, Check, CheckCircle } from '@/components/icons';
import { surveyApi } from '@/services/api';
import type { EditSubmission } from '@/types';

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function Edit() {
  const { token } = useParams<{ token: string }>();

  const [submission, setSubmission] = useState<EditSubmission | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Calendar state
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token) {
      setError('Invalid edit link');
      setLoading(false);
      return;
    }

    surveyApi
      .getByToken(token)
      .then((res) => {
        const data = res.data!;
        setSubmission(data);
        setSelectedDates(new Set(data.unavailable_dates));
        setCurrentDate(new Date(data.start_date + 'T00:00:00'));
      })
      .catch(() => {
        setError('This edit link is invalid or has expired.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!token) return;

    setSaving(true);
    setError('');

    try {
      await surveyApi.updateByToken(token, Array.from(selectedDates));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

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
    setSaved(false);
  }, []);

  const prevMonth = () => {
    setCurrentDate((prev) => {
      if (!prev) return prev;
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const nextMonth = () => {
    setCurrentDate((prev) => {
      if (!prev) return prev;
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthYear = currentDate?.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  }) || '';

  if (loading) {
    return (
      <Layout>
        <p className="text-gray-500">Loading...</p>
      </Layout>
    );
  }

  if (error && !submission) {
    return (
      <Layout>
        <Card size="md">
          <div className="text-center py-8">
            <p className="text-danger mb-4">{error}</p>
            <Link to="/">
              <Button variant="secondary">Back to Home</Button>
            </Link>
          </div>
        </Card>
      </Layout>
    );
  }

  if (!submission || !currentDate) return null;

  return (
    <Layout>
      <Card size="md">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={18} />
            Back
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-3">
            Edit Availability
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {submission.survey_name} &bull; {submission.person_name}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatDisplayDate(submission.start_date)} – {formatDisplayDate(submission.end_date)}
          </p>
        </div>

        {saved ? (
          <div className="animate-fadeIn text-center py-8">
            <div className="text-success mb-4">
              <CheckCircle />
            </div>
            <h2 className="text-xl font-semibold text-success mb-2">
              Changes Saved!
            </h2>
            <p className="text-gray-500 mb-6">
              Your availability has been updated successfully.
            </p>
            <Button variant="secondary" onClick={() => setSaved(false)}>
              Make More Changes
            </Button>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Update your unavailable dates
            </h2>
            <p className="text-gray-500 mb-4">
              Click or drag to select dates when you're NOT available
            </p>

            <Calendar
              selectedDates={selectedDates}
              onToggleDate={toggleDate}
              currentDate={currentDate}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              onToday={goToToday}
              monthYear={monthYear}
              minDate={submission.start_date}
              maxDate={submission.end_date}
            />

            <div className="flex justify-center gap-8 my-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-5 h-5 rounded border border-gray-300 bg-white" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-5 h-5 rounded bg-primary" />
                <span>Unavailable</span>
              </div>
            </div>

            <div className="bg-beige-light rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-gray-700">
                Selected unavailable dates:{' '}
                <span className="text-primary">{selectedDates.size}</span>
              </p>
            </div>

            {error && <p className="text-danger text-sm mb-4">{error}</p>}

            <Button size="lg" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
              <Check />
            </Button>
          </div>
        )}
      </Card>
    </Layout>
  );
}

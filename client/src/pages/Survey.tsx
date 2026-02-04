import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, Button, Input } from '@/components/ui';
import { Calendar } from '@/components/Calendar';
import { ChevronLeft, ArrowRight, Check, CheckCircle } from '@/components/icons';
import { surveyApi } from '@/services/api';
import type { Survey as SurveyType } from '@/types';

type Step = 'name' | 'calendar' | 'success';

export function Survey() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<SurveyType | null>(null);
  const [step, setStep] = useState<Step>('name');
  const [personName, setPersonName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!code) {
      navigate('/');
      return;
    }

    surveyApi
      .getByCode(code)
      .then((res) => setSurvey(res.data!))
      .catch(() => navigate('/'));
  }, [code, navigate]);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await surveyApi.checkName(code!, personName.trim());
      if (res.data?.exists) {
        setError(
          'You have already submitted. Contact the admin to make changes.'
        );
        return;
      }
      setStep('calendar');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await surveyApi.submit(code!, personName.trim(), Array.from(selectedDates));
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setLoading(false);
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
  }, []);

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

  if (!survey) {
    return (
      <Layout>
        <p className="text-gray-500">Loading...</p>
      </Layout>
    );
  }

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
          <h1 className="text-xl font-bold text-gray-900 mt-3">{survey.name}</h1>
        </div>

        {step === 'name' && (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              What's your name?
            </h2>
            <p className="text-gray-500 mb-6">
              Enter your name to submit your availability
            </p>

            <form onSubmit={handleNameSubmit} className="space-y-4">
              <Input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Your name"
                autoComplete="off"
                error={error}
              />
              <Button type="submit" disabled={loading}>
                Continue
                <ArrowRight />
              </Button>
            </form>
          </div>
        )}

        {step === 'calendar' && (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Mark your unavailable dates
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
              monthYear={monthYear}
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

            <Button size="lg" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Availability'}
              <Check />
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="animate-fadeIn text-center py-8">
            <div className="text-success mb-4">
              <CheckCircle />
            </div>
            <h2 className="text-xl font-semibold text-success mb-2">
              Thank you!
            </h2>
            <p className="text-gray-500 mb-6">
              Your availability has been submitted successfully.
            </p>
            <Link to="/">
              <Button variant="secondary">Back to Home</Button>
            </Link>
          </div>
        )}
      </Card>
    </Layout>
  );
}

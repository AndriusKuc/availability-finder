import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, Button, Input } from '@/components/ui';
import { CalendarIcon, ArrowRight } from '@/components/icons';
import { surveyApi } from '@/services/api';

export function Home() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter a survey code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await surveyApi.getByCode(code.trim());
      navigate(`/survey/${code.trim().toUpperCase()}`);
    } catch {
      setError('Survey not found. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Card className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-primary rounded-xl flex items-center justify-center text-white">
          <CalendarIcon />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Team Availability
        </h1>
        <p className="text-gray-500 mb-6">
          Enter your survey code to mark your unavailable dates
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter survey code"
            autoComplete="off"
            error={error}
          />
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Loading...' : 'Continue'}
            <ArrowRight />
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            to="/admin"
            className="text-sm text-gray-500 hover:text-primary transition-colors"
          >
            Admin Access
          </Link>
        </div>
      </Card>
    </Layout>
  );
}

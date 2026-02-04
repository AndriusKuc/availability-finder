import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Card, Button, Input } from '@/components/ui';
import { Plus, Trash, Copy } from '@/components/icons';
import { adminApi } from '@/services/api';
import { SurveyModal } from './SurveyModal';
import type { SurveyWithCount } from '@/types';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [surveys, setSurveys] = useState<SurveyWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSurveyName, setNewSurveyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyWithCount | null>(
    null
  );

  const loadSurveys = useCallback(async () => {
    try {
      const res = await adminApi.getSurveys();
      setSurveys(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurveyName.trim()) return;

    setCreating(true);
    try {
      await adminApi.createSurvey(newSurveyName.trim());
      setNewSurveyName('');
      loadSurveys();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSurvey = async (id: number) => {
    if (!confirm('Delete this survey and all submissions?')) return;

    try {
      await adminApi.deleteSurvey(id);
      loadSurveys();
    } catch (err) {
      console.error(err);
    }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/survey/${code}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <Layout centered={false}>
      <div className="w-full max-w-4xl">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button variant="secondary" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </header>

        <Card size="lg" className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Create New Survey
          </h2>
          <form onSubmit={handleCreateSurvey} className="flex gap-4">
            <Input
              type="text"
              value={newSurveyName}
              onChange={(e) => setNewSurveyName(e.target.value)}
              placeholder="Survey name (e.g., Q1 Team Meetup)"
              className="flex-1"
            />
            <Button type="submit" disabled={creating || !newSurveyName.trim()}>
              <Plus size={18} />
              Create
            </Button>
          </form>
        </Card>

        <Card size="lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Your Surveys
          </h2>

          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading surveys...</p>
          ) : surveys.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No surveys yet. Create one above!
            </p>
          ) : (
            <div className="space-y-4">
              {surveys.map((survey) => (
                <div
                  key={survey.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gray-50 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {survey.name}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <span>
                        Code:{' '}
                        <strong className="text-primary">{survey.code}</strong>
                      </span>
                      <span>{survey.submission_count} submissions</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/survey/${survey.code}`}
                        readOnly
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-600"
                      />
                      <button
                        onClick={() => copyLink(survey.code)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Copy link"
                      >
                        <Copy />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => setSelectedSurvey(survey)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteSurvey(survey.id)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {selectedSurvey && (
        <SurveyModal
          survey={selectedSurvey}
          onClose={() => setSelectedSurvey(null)}
          onUpdate={loadSurveys}
        />
      )}
    </Layout>
  );
}

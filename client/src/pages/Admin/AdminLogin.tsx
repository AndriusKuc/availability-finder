import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, Button, Input } from '@/components/ui';
import { Lock, ArrowRight } from '@/components/icons';

interface AdminLoginProps {
  onLogin: (password: string) => Promise<void>;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onLogin(password);
    } catch {
      setError('Invalid password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Card className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-primary rounded-xl flex items-center justify-center text-white">
          <Lock />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
        <p className="text-gray-500 mb-6">Enter your admin password to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            error={error}
          />
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
            <ArrowRight />
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-primary transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </Card>
    </Layout>
  );
}

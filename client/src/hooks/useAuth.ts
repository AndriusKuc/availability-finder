import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/services/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await adminApi.checkAuth();
      setIsAuthenticated(response.data?.authenticated ?? false);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (password: string) => {
    await adminApi.login(password);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await adminApi.logout();
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, isLoading, login, logout };
}

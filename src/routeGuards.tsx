import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/useAuthStore';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuthStore();

  if (loading) return <p>Loading...</p>;
  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuthStore();

  if (loading) return <p>Loading...</p>;
  if (session) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

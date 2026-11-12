import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { Session, User } from '@supabase/supabase-js';
import { useAuthStore } from '../lib/useAuthStore';

export const signIn = (userId = 'user-1') => {
  useAuthStore.setState({
    user: { id: userId } as unknown as User,
    session: { user: { id: userId } } as unknown as Session,
    loading: false,
  });
};

export const signOut = () => {
  useAuthStore.setState({ user: null, session: null, loading: false });
};

export const renderWithProviders = (ui: ReactElement, { route = '/' }: { route?: string } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

import { beforeEach, describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { ProtectedRoute, PublicOnlyRoute } from './routeGuards';
import { useAuthStore } from './lib/useAuthStore';
import { renderWithProviders, signIn, signOut } from './test/renderWithProviders';

const routes = (
  <Routes>
    <Route path="/login" element={<PublicOnlyRoute><p>Login page</p></PublicOnlyRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><p>Private dashboard</p></ProtectedRoute>} />
  </Routes>
);

describe('route guards', () => {
  beforeEach(() => signOut());

  it('redirects an unauthenticated visitor from a protected route to /login', () => {
    renderWithProviders(routes, { route: '/dashboard' });
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Private dashboard')).not.toBeInTheDocument();
  });

  it('shows the protected page to a signed-in user', () => {
    signIn();
    renderWithProviders(routes, { route: '/dashboard' });
    expect(screen.getByText('Private dashboard')).toBeInTheDocument();
  });

  it('redirects a signed-in user away from public-only pages', () => {
    signIn();
    renderWithProviders(routes, { route: '/login' });
    expect(screen.getByText('Private dashboard')).toBeInTheDocument();
  });

  it('waits while the session is still loading', () => {
    useAuthStore.setState({ user: null, session: null, loading: true });
    renderWithProviders(routes, { route: '/dashboard' });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

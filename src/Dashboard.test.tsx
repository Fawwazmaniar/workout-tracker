import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { fetchActiveSplit, fetchDashboardStats, fetchWorkoutHistory } from './lib/logs';
import { renderWithProviders, signIn } from './test/renderWithProviders';

vi.mock('./lib/logs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/logs')>()),
  fetchActiveSplit: vi.fn(),
  fetchDashboardStats: vi.fn(),
  fetchWorkoutHistory: vi.fn(),
  deleteWorkout: vi.fn(),
}));

describe('Dashboard session history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signIn();
    vi.mocked(fetchActiveSplit).mockResolvedValue({ id: 'split-1', name: 'PPL' } as never);
    vi.mocked(fetchDashboardStats).mockResolvedValue({ totalWorkouts: 2, weekWorkouts: 1 });
  });

  it('renders past sessions with their day name and date', async () => {
    vi.mocked(fetchWorkoutHistory).mockResolvedValue([
      { id: 'w1', performed_at: '2025-03-15T12:00:00Z', workout_templates: { name: 'Push' } },
      { id: 'w2', performed_at: '2025-03-13T12:00:00Z', workout_templates: { name: 'Pull' } },
    ] as never);
    renderWithProviders(<Dashboard />);

    expect(await screen.findByText('Push')).toBeInTheDocument();
    expect(screen.getByText('Pull')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Delete workout' })).toHaveLength(2);
    expect(screen.getByText('PPL')).toBeInTheDocument();
  });

  it('shows an empty state when there are no sessions', async () => {
    vi.mocked(fetchWorkoutHistory).mockResolvedValue([]);
    renderWithProviders(<Dashboard />);
    expect(await screen.findByText('No workouts logged yet.')).toBeInTheDocument();
  });

  it('shows an error when history fails to load', async () => {
    vi.mocked(fetchWorkoutHistory).mockRejectedValue(new Error('network'));
    renderWithProviders(<Dashboard />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load your dashboard/i);
  });
});

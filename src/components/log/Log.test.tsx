import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Log } from './Log';
import { fetchActiveSplit, finishWorkout } from '../../lib/logs';
import { fetchTemplatesWithExercises } from '../../lib/splits';
import { renderWithProviders, signIn } from '../../test/renderWithProviders';

vi.mock('../../lib/logs', () => ({
  fetchActiveSplit: vi.fn(),
  fetchWorkoutForEdit: vi.fn(),
  saveWorkoutEdits: vi.fn(),
  finishWorkout: vi.fn(),
}));
vi.mock('../../lib/splits', () => ({ fetchTemplatesWithExercises: vi.fn() }));

const templates = [
  {
    id: 'day-1',
    name: 'Push',
    day_order: 1,
    workout_template_exercises: [
      { id: 'te-1', exercise_order: 1, exercises: { id: 'bench', name: 'Bench Press', category: 'Chest' } },
    ],
  },
];

const openPushDay = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.selectOptions(await screen.findByLabelText('Choose training day'), 'Push');
};

describe('Log workout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signIn();
    vi.mocked(fetchActiveSplit).mockResolvedValue({ id: 'split-1', name: 'PPL' } as never);
    vi.mocked(fetchTemplatesWithExercises).mockResolvedValue(templates as never);
    vi.mocked(finishWorkout).mockResolvedValue('workout-1');
  });

  it('lets the user enter weight and reps, flag a warm-up and add a note', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Log />);
    await openPushDay(user);

    await user.click(screen.getByRole('button', { name: 'Add set' }));
    await user.type(screen.getByLabelText('Bench Press set 1 weight'), '60');
    await user.type(screen.getByLabelText('Bench Press set 1 reps'), '8');
    await user.click(screen.getByRole('checkbox', { name: /warm-up/i }));
    await user.type(screen.getByLabelText('Notes'), 'Felt strong');

    expect(screen.getByLabelText('Bench Press set 1 weight')).toHaveValue(60);
    expect(screen.getByLabelText('Bench Press set 1 reps')).toHaveValue(8);
    expect(screen.getByRole('checkbox', { name: /warm-up/i })).toBeChecked();
    expect(screen.getByLabelText('Notes')).toHaveValue('Felt strong');
  });

  it('keeps Finish disabled until every set has weight and reps', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Log />);
    await openPushDay(user);

    expect(screen.getByRole('button', { name: 'Finish workout' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Add set' }));
    await user.type(screen.getByLabelText('Bench Press set 1 weight'), '60');
    expect(screen.getByRole('button', { name: 'Finish workout' })).toBeDisabled();
    await user.type(screen.getByLabelText('Bench Press set 1 reps'), '8');
    expect(screen.getByRole('button', { name: 'Finish workout' })).toBeEnabled();
  });

  it('saves nothing until Finish, then calls the save function once with the full payload', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Log />);
    await openPushDay(user);

    await user.click(screen.getByRole('button', { name: 'Add set' }));
    await user.type(screen.getByLabelText('Bench Press set 1 weight'), '60');
    await user.type(screen.getByLabelText('Bench Press set 1 reps'), '8');
    await user.click(screen.getByRole('checkbox', { name: /warm-up/i }));
    await user.type(screen.getByLabelText('Notes'), 'Felt strong');

    expect(finishWorkout).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Finish workout' }));

    await waitFor(() => expect(finishWorkout).toHaveBeenCalledTimes(1));
    expect(finishWorkout).toHaveBeenCalledWith({
      template_id: 'day-1',
      sets: [{ exercise_id: 'bench', set_number: 1, weight: 60, reps: 8, is_warmup: true }],
      notes: [{ exercise_id: 'bench', note: 'Felt strong' }],
    });
  });

  it('shows an error when the active split cannot be loaded', async () => {
    vi.mocked(fetchActiveSplit).mockRejectedValue(new Error('network'));
    renderWithProviders(<Log />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load your training split/i);
  });
});

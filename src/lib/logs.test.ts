import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../test/supabaseMock';
import { finishWorkout } from './logs';
import { buildFinishPayload } from './workoutLog';

describe('finishWorkout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls the finish_workout RPC exactly once with the whole payload', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: 'workout-1', error: null } as never);
    const payload = buildFinishPayload(
      'day-1',
      { bench: [{ weight: '60', reps: '8', isWarmup: false }] },
      { bench: 'Felt strong' }
    );

    const id = await finishWorkout(payload);

    expect(id).toBe('workout-1');
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledWith('finish_workout', { payload });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('throws when the RPC reports an error so nothing is treated as saved', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: new Error('rls') } as never);
    await expect(
      finishWorkout({ template_id: 'day-1', sets: [], notes: [] })
    ).rejects.toThrow('rls');
  });
});

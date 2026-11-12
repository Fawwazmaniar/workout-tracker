import { describe, expect, it } from 'vitest';
import {
  addSet,
  buildFinishPayload,
  canFinishWorkout,
  countSets,
  deleteSet,
  updateSet,
  type SetsByExercise,
} from './workoutLog';

describe('workout set helpers', () => {
  it('adds an empty, non-warm-up set to an exercise', () => {
    const sets = addSet({}, 'bench');
    expect(sets).toEqual({ bench: [{ weight: '', reps: '', isWarmup: false }] });
  });

  it('does not mutate the previous state when adding a set', () => {
    const before: SetsByExercise = { bench: [] };
    addSet(before, 'bench');
    expect(before.bench).toHaveLength(0);
  });

  it('edits weight, reps and the warm-up flag of one set', () => {
    let sets = addSet({}, 'bench');
    sets = updateSet(sets, 'bench', 0, 'weight', '60');
    sets = updateSet(sets, 'bench', 0, 'reps', '8');
    sets = updateSet(sets, 'bench', 0, 'isWarmup', true);
    expect(sets.bench[0]).toEqual({ weight: '60', reps: '8', isWarmup: true });
  });

  it('removes only the targeted set', () => {
    let sets = addSet(addSet({}, 'bench'), 'bench');
    sets = updateSet(sets, 'bench', 1, 'weight', '80');
    sets = deleteSet(sets, 'bench', 0);
    expect(sets.bench).toEqual([{ weight: '80', reps: '', isWarmup: false }]);
  });

  it('counts sets across exercises', () => {
    const sets = addSet(addSet(addSet({}, 'bench'), 'bench'), 'squat');
    expect(countSets(sets)).toBe(3);
  });
});

describe('canFinishWorkout', () => {
  it('is false when nothing is logged', () => {
    expect(canFinishWorkout({})).toBe(false);
  });

  it('is false while any set is missing weight or reps', () => {
    const sets = updateSet(addSet({}, 'bench'), 'bench', 0, 'weight', '60');
    expect(canFinishWorkout(sets)).toBe(false);
  });

  it('is true when every set has weight and reps', () => {
    let sets = addSet({}, 'bench');
    sets = updateSet(sets, 'bench', 0, 'weight', '60');
    sets = updateSet(sets, 'bench', 0, 'reps', '8');
    expect(canFinishWorkout(sets)).toBe(true);
  });
});

describe('buildFinishPayload', () => {
  const sets: SetsByExercise = {
    bench: [
      { weight: '40', reps: '10', isWarmup: true },
      { weight: '62.5', reps: '8', isWarmup: false },
    ],
    squat: [{ weight: '100', reps: '5', isWarmup: false }],
  };

  it('numbers sets per exercise and converts strings to numbers', () => {
    const payload = buildFinishPayload('day-1', sets, {});
    expect(payload.template_id).toBe('day-1');
    expect(payload.sets).toEqual([
      { exercise_id: 'bench', set_number: 1, weight: 40, reps: 10, is_warmup: true },
      { exercise_id: 'bench', set_number: 2, weight: 62.5, reps: 8, is_warmup: false },
      { exercise_id: 'squat', set_number: 1, weight: 100, reps: 5, is_warmup: false },
    ]);
  });

  it('trims notes and drops blank ones', () => {
    const payload = buildFinishPayload('day-1', sets, { bench: '  felt strong ', squat: '   ' });
    expect(payload.notes).toEqual([{ exercise_id: 'bench', note: 'felt strong' }]);
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './useAuthStore';
import { useUnsavedWorkoutStore } from './useUnsavedWorkoutStore';

describe('useUnsavedWorkoutStore', () => {
  beforeEach(() => useUnsavedWorkoutStore.setState({ hasUnsavedProgress: false }));

  it('starts without unsaved progress and can flag and clear it', () => {
    expect(useUnsavedWorkoutStore.getState().hasUnsavedProgress).toBe(false);
    useUnsavedWorkoutStore.getState().setHasUnsavedProgress(true);
    expect(useUnsavedWorkoutStore.getState().hasUnsavedProgress).toBe(true);
    useUnsavedWorkoutStore.getState().setHasUnsavedProgress(false);
    expect(useUnsavedWorkoutStore.getState().hasUnsavedProgress).toBe(false);
  });
});

describe('useAuthStore', () => {
  it('stores the role and loading flag', () => {
    useAuthStore.getState().setRole('admin');
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().role).toBe('admin');
    expect(useAuthStore.getState().loading).toBe(false);
  });
});

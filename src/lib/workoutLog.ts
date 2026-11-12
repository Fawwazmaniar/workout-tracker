export interface SetEntry {
  weight: string;
  reps: string;
  isWarmup: boolean;
}

export type SetsByExercise = Record<string, SetEntry[]>;
export type NotesByExercise = Record<string, string>;

export interface FinishWorkoutPayload {
  template_id: string;
  sets: Array<{
    exercise_id: string;
    set_number: number;
    weight: number;
    reps: number;
    is_warmup: boolean;
  }>;
  notes: Array<{ exercise_id: string; note: string }>;
}

export const addSet = (sets: SetsByExercise, exerciseId: string): SetsByExercise => ({
  ...sets,
  [exerciseId]: [...(sets[exerciseId] ?? []), { weight: "", reps: "", isWarmup: false }],
});

export const updateSet = (
  sets: SetsByExercise,
  exerciseId: string,
  index: number,
  field: keyof SetEntry,
  value: string | boolean
): SetsByExercise => {
  const updated = [...(sets[exerciseId] ?? [])];
  updated[index] = { ...updated[index], [field]: value };
  return { ...sets, [exerciseId]: updated };
};

export const deleteSet = (sets: SetsByExercise, exerciseId: string, index: number): SetsByExercise => ({
  ...sets,
  [exerciseId]: (sets[exerciseId] ?? []).filter((_, i) => i !== index),
});

export const countSets = (sets: SetsByExercise): number => Object.values(sets).flat().length;

export const hasIncompleteSets = (sets: SetsByExercise): boolean =>
  Object.values(sets)
    .flat()
    .some((set) => !set.weight || !set.reps);

export const canFinishWorkout = (sets: SetsByExercise): boolean =>
  countSets(sets) > 0 && !hasIncompleteSets(sets);

export const buildFinishPayload = (
  templateId: string,
  sets: SetsByExercise,
  notes: NotesByExercise
): FinishWorkoutPayload => ({
  template_id: templateId,
  sets: Object.entries(sets).flatMap(([exerciseId, exerciseSets]) =>
    exerciseSets.map((set, index) => ({
      exercise_id: exerciseId,
      set_number: index + 1,
      weight: parseFloat(set.weight),
      reps: parseInt(set.reps, 10),
      is_warmup: set.isWarmup,
    }))
  ),
  notes: Object.entries(notes)
    .filter(([, note]) => note.trim().length > 0)
    .map(([exerciseId, note]) => ({ exercise_id: exerciseId, note: note.trim() })),
});

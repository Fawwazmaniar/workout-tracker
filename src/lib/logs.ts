import { supabase } from "./supabaseClient"

export const fetchActiveSplit = async (userId: string) => {
  const { data, error } = await supabase
    .from("training_splits")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const createWorkout = async (userId: string, templateId: string) => {
  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: userId,
      template_id: templateId,
      performed_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const createSet = async (
  workoutId: string,
  exerciseId: string,
  setNumber: number,
  weight: number,
  reps: number,
  isWarmup: boolean
) => {
  const { data, error } = await supabase
    .from("sets")
    .insert({
      workout_id: workoutId,
      exercise_id: exerciseId,
      set_number: setNumber,
      weight,
      reps,
      is_warmup: isWarmup,
    })
    .select();
  if (error) throw error;
  return data;
};

export const unwrapExerciseRelation = (relation: unknown) => {
  const value = relation as { id?: string; name?: string } | Array<{ id?: string; name?: string }> | null;
  return Array.isArray(value) ? value[0] : value;
};

export const upsertExerciseNote = async (workoutId: string, exerciseId: string, note: string) => {
  const { data, error } = await supabase
    .from("workout_exercise_notes")
    .upsert({ workout_id: workoutId, exercise_id: exerciseId, note }, { onConflict: "workout_id,exercise_id" })
    .select();
  if (error) throw error;
  return data;
};

export const fetchWorkoutHistory = async (userId: string, limit?: number) => {
  let query = supabase
    .from("workouts")
    .select(`
      id,
      performed_at,
      workout_templates ( name )
    `)
    .eq("user_id", userId)
    .order("performed_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const deleteWorkout = async (workoutId: string) => {
  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId);

  if (error) throw error;
};

export const fetchDashboardStats = async (userId: string) => {
  const { count: totalWorkouts, error: totalError } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (totalError) throw totalError;

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const { count: weekWorkouts, error: weekError } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("performed_at", startOfWeek.toISOString());
  if (weekError) throw weekError;

  return { totalWorkouts: totalWorkouts ?? 0, weekWorkouts: weekWorkouts ?? 0 };
};


export const fetchWorkoutDetail = async (workoutId: string) => {
  const { data: sets, error: setsError } = await supabase
    .from("sets")
    .select(`id, set_number, weight, reps, is_warmup, exercise_id, exercises ( id, name )`)
    .eq("workout_id", workoutId)
    .order("set_number");
  if (setsError) throw setsError;

  const { data: notes, error: notesError } = await supabase
    .from("workout_exercise_notes")
    .select("exercise_id, note")
    .eq("workout_id", workoutId);
  if (notesError) throw notesError;

  return { sets, notes };
};

export const fetchWorkoutForEdit = async (workoutId: string) => {
  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("id, template_id")
    .eq("id", workoutId)
    .single();
  if (workoutError) throw workoutError;

  const { sets, notes } = await fetchWorkoutDetail(workoutId);
  return { ...workout, sets, notes };
};

type EditableSetEntry = {
  weight: string;
  reps: string;
  isWarmup: boolean;
};

export const saveWorkoutEdits = async (
  workoutId: string,
  templateId: string,
  setsByExercise: Record<string, EditableSetEntry[]>,
  notesByExercise: Record<string, string>
) => {
  const { error: workoutError } = await supabase
    .from("workouts")
    .update({ template_id: templateId })
    .eq("id", workoutId);
  if (workoutError) throw workoutError;

  const { error: deleteSetsError } = await supabase
    .from("sets")
    .delete()
    .eq("workout_id", workoutId);
  if (deleteSetsError) throw deleteSetsError;

  const setRows = Object.entries(setsByExercise).flatMap(([exerciseId, sets]) =>
    sets.map((set, index) => ({
      workout_id: workoutId,
      exercise_id: exerciseId,
      set_number: index + 1,
      weight: Number.parseFloat(set.weight),
      reps: Number.parseInt(set.reps, 10),
      is_warmup: set.isWarmup,
    }))
  );

  if (setRows.length) {
    const { error: insertSetsError } = await supabase.from("sets").insert(setRows);
    if (insertSetsError) throw insertSetsError;
  }

  const { error: deleteNotesError } = await supabase
    .from("workout_exercise_notes")
    .delete()
    .eq("workout_id", workoutId);
  if (deleteNotesError) throw deleteNotesError;

  const noteRows = Object.entries(notesByExercise)
    .map(([exerciseId, note]) => ({ exercise_id: exerciseId, note: note.trim() }))
    .filter((entry) => entry.note.length > 0)
    .map((entry) => ({
      workout_id: workoutId,
      exercise_id: entry.exercise_id,
      note: entry.note,
    }));

  if (noteRows.length) {
    const { error: insertNotesError } = await supabase.from("workout_exercise_notes").insert(noteRows);
    if (insertNotesError) throw insertNotesError;
  }
};
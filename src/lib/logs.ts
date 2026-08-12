import { supabase } from "./supabaseClient"

export const fetchActiveSplit = async (userId: string) => {
  const { data, error } = await supabase
    .from("training_splits")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();
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
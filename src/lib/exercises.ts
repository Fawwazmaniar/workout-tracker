import { supabase } from "./supabaseClient";

export const fetchExercises = async () => {
  const { data, error } = await supabase.from("exercises").select("*").order("name");
  if (error) throw error;
  return data;
};

export const createExercise = async (name: string, category: ExerciseCategory) => {
  const { data, error } = await supabase.from("exercises").insert({ name, category }).select();
  if (error) throw error;
  return data;
};

export const updateExercise = async (id: string, updates: { name?: string; category?: ExerciseCategory }) => {
  const { data, error } = await supabase.from("exercises").update(updates).eq("id", id).select();
  if (error) throw error;
  return data;
};

export const deleteExercise = async (id: string) => {
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throw error;
};

export const EXERCISE_CATEGORIES = [
  "Chest",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Traps",
  "Lats",
  "Upper Back",
  "Lower Back",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
  "Conditioning"
] as const;

export type ExerciseCategory = typeof EXERCISE_CATEGORIES[number];

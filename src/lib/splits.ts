import { supabase } from "./supabaseClient";

export const fetchSplits = async (userId: string) => {
  const { data, error } = await supabase
    .from("training_splits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return data;
};

export const fetchSplitById = async (splitId: string) => {
  const { data, error } = await supabase
    .from("training_splits")
    .select("*")
    .eq("id", splitId)
    .single();
  if (error) throw error;
  return data;
};

export const createSplit = async (userId: string, name: string) => {
  const { data, error } = await supabase
    .from("training_splits")
    .insert({ user_id: userId, name })
    .select();
  if (error) throw error;
  return data;
};

export const updateSplit = async (splitId: string, name: string) => {
  const { data, error } = await supabase
    .from("training_splits")
    .update({ name })
    .eq("id", splitId)
    .select();
  if (error) throw error;
  return data;
};

export const deleteSplit = async (splitId: string) => {
  const { error } = await supabase
    .from("training_splits")
    .delete()
    .eq("id", splitId);
  if (error) throw error;
};

export const fetchTemplatesBySplit = async (splitId: string) => {
  const { data, error } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("split_id", splitId)
    .order("day_order");
  if (error) throw error;
  return data;
};

export const fetchTemplatesWithExercises = async (splitId: string) => {
  const { data, error } = await supabase
    .from("workout_templates")
    .select(`
      id,
      name,
      day_order,
      workout_template_exercises (
        id,
        exercise_order,
        exercises ( id, name, category )
      )
    `)
    .eq("split_id", splitId)
    .order("day_order");
  if (error) throw error;
  return data;
};

export const createTemplate = async (splitId: string, name: string, dayOrder: number) => {
  const { data, error } = await supabase
    .from("workout_templates")
    .insert({ split_id: splitId, name, day_order: dayOrder })
    .select();
  if (error) throw error;
  return data;
};


export const addExerciseToTemplate = async (id: string, order: number, templateId: string) => {
  const { data, error } = await supabase
    .from("workout_template_exercises")
    .insert({ exercise_id: id, exercise_order: order, template_id: templateId })
    .select();
  if (error) throw error;
  return data;
};

export const removeExerciseFromTemplate = async (templateExerciseId: string) => {
  const { error } = await supabase
    .from("workout_template_exercises")
    .delete()
    .eq("id", templateExerciseId);
  if (error) throw error;
};

export const updateExerciseInTemplate = async (id: string, exerciseId: string,  order: number, templateId: string) => {
  const { data, error } = await supabase
    .from("workout_template_exercises")
    .update({  exercise_id: exerciseId, exercise_order: order, template_id: templateId })
    .eq("id", id)
    .select();
  if (error) throw error;
  return data;
};

export const updateTemplate = async (templateId: string, name: string) => {
  const { data, error } = await supabase
    .from("workout_templates")
    .update({ name })
    .eq("id", templateId)
    .select();
  if (error) throw error;
  return data;
};


import { supabase } from "./supabaseClient";

export const fetchProfile = async (id: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};
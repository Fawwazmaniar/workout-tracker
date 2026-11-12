-- Reference copy of policies applied in the Supabase dashboard.
-- Verify against the live project. Nothing here has been run against it.
--
-- Written from the queries in src/lib/*.ts. Table and column names come from
-- the client code; types, constraints and foreign keys are not restated here.
-- Ownership model:
--   training_splits.user_id           -> owner
--   workout_templates.split_id        -> training_splits
--   workout_template_exercises.template_id -> workout_templates
--   workouts.user_id                  -> owner
--   sets.workout_id, workout_exercise_notes.workout_id -> workouts
--   exercises                         -> shared catalogue (no user_id column is
--                                        written by the client); the UI only
--                                        offers writes to profiles.role = 'admin'
--   profiles.id                       -> auth.users.id

-- Helper: is the caller an admin? SECURITY DEFINER so the check itself is not
-- blocked by RLS on profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------- profiles
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());
-- Users must not be able to change their own role, so there is deliberately
-- no client-facing update policy for profiles.role. Confirm in the dashboard.

-- --------------------------------------------------------------- exercises
alter table public.exercises enable row level security;

create policy "exercises_select_authenticated" on public.exercises
  for select to authenticated using (true);
create policy "exercises_insert_admin" on public.exercises
  for insert to authenticated with check (public.is_admin());
create policy "exercises_update_admin" on public.exercises
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "exercises_delete_admin" on public.exercises
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------- training_splits
alter table public.training_splits enable row level security;

create policy "training_splits_select_own" on public.training_splits
  for select to authenticated using (user_id = auth.uid());
create policy "training_splits_insert_own" on public.training_splits
  for insert to authenticated with check (user_id = auth.uid());
create policy "training_splits_update_own" on public.training_splits
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "training_splits_delete_own" on public.training_splits
  for delete to authenticated using (user_id = auth.uid());

-- -------------------------------------------------------- workout_templates
alter table public.workout_templates enable row level security;

create policy "workout_templates_select_own" on public.workout_templates
  for select to authenticated using (
    exists (select 1 from public.training_splits s where s.id = split_id and s.user_id = auth.uid()));
create policy "workout_templates_insert_own" on public.workout_templates
  for insert to authenticated with check (
    exists (select 1 from public.training_splits s where s.id = split_id and s.user_id = auth.uid()));
create policy "workout_templates_update_own" on public.workout_templates
  for update to authenticated
  using (exists (select 1 from public.training_splits s where s.id = split_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.training_splits s where s.id = split_id and s.user_id = auth.uid()));
create policy "workout_templates_delete_own" on public.workout_templates
  for delete to authenticated using (
    exists (select 1 from public.training_splits s where s.id = split_id and s.user_id = auth.uid()));

-- ------------------------------------------------ workout_template_exercises
alter table public.workout_template_exercises enable row level security;

create policy "workout_template_exercises_select_own" on public.workout_template_exercises
  for select to authenticated using (
    exists (select 1 from public.workout_templates t
            join public.training_splits s on s.id = t.split_id
            where t.id = template_id and s.user_id = auth.uid()));
create policy "workout_template_exercises_insert_own" on public.workout_template_exercises
  for insert to authenticated with check (
    exists (select 1 from public.workout_templates t
            join public.training_splits s on s.id = t.split_id
            where t.id = template_id and s.user_id = auth.uid()));
create policy "workout_template_exercises_update_own" on public.workout_template_exercises
  for update to authenticated
  using (exists (select 1 from public.workout_templates t
                 join public.training_splits s on s.id = t.split_id
                 where t.id = template_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.workout_templates t
                      join public.training_splits s on s.id = t.split_id
                      where t.id = template_id and s.user_id = auth.uid()));
create policy "workout_template_exercises_delete_own" on public.workout_template_exercises
  for delete to authenticated using (
    exists (select 1 from public.workout_templates t
            join public.training_splits s on s.id = t.split_id
            where t.id = template_id and s.user_id = auth.uid()));

-- ---------------------------------------------------------------- workouts
alter table public.workouts enable row level security;

create policy "workouts_select_own" on public.workouts
  for select to authenticated using (user_id = auth.uid());
create policy "workouts_insert_own" on public.workouts
  for insert to authenticated with check (user_id = auth.uid());
create policy "workouts_update_own" on public.workouts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "workouts_delete_own" on public.workouts
  for delete to authenticated using (user_id = auth.uid());

-- -------------------------------------------------------------------- sets
alter table public.sets enable row level security;

create policy "sets_select_own" on public.sets
  for select to authenticated using (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "sets_insert_own" on public.sets
  for insert to authenticated with check (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "sets_update_own" on public.sets
  for update to authenticated
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "sets_delete_own" on public.sets
  for delete to authenticated using (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

-- ----------------------------------------------------- workout_exercise_notes
alter table public.workout_exercise_notes enable row level security;

create policy "workout_exercise_notes_select_own" on public.workout_exercise_notes
  for select to authenticated using (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "workout_exercise_notes_insert_own" on public.workout_exercise_notes
  for insert to authenticated with check (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "workout_exercise_notes_update_own" on public.workout_exercise_notes
  for update to authenticated
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "workout_exercise_notes_delete_own" on public.workout_exercise_notes
  for delete to authenticated using (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

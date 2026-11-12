-- Atomic "Finish workout".
--
-- HOW TO APPLY: open the Supabase dashboard -> SQL Editor -> paste this file
-- -> Run. Apply it BEFORE deploying a client build that calls
-- supabase.rpc('finish_workout', ...), otherwise Finish will fail.
-- Nothing in this repo runs it for you.
--
-- Runs as SECURITY INVOKER (the default), so row level security applies to
-- every insert. Ownership comes from auth.uid(), never from the payload.
-- A plpgsql function body is a single transaction: if any insert fails, the
-- workout, sets and notes are all rolled back together.
--
-- Payload shape:
-- {
--   "template_id": "<uuid>",
--   "sets":  [ { "exercise_id": "<uuid>", "set_number": 1, "weight": 60, "reps": 8, "is_warmup": false } ],
--   "notes": [ { "exercise_id": "<uuid>", "note": "felt strong" } ]
-- }
-- Returns the new workout id.

create or replace function public.finish_workout(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id    uuid := auth.uid();
  v_workout_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if jsonb_typeof(payload -> 'sets') is distinct from 'array'
     or jsonb_array_length(payload -> 'sets') = 0 then
    raise exception 'A workout needs at least one set' using errcode = '22023';
  end if;

  insert into workouts (user_id, template_id, performed_at)
  values (v_user_id, (payload ->> 'template_id')::uuid, now())
  returning id into v_workout_id;

  insert into sets (workout_id, exercise_id, set_number, weight, reps, is_warmup)
  select v_workout_id,
         (s ->> 'exercise_id')::uuid,
         (s ->> 'set_number')::int,
         (s ->> 'weight')::numeric,
         (s ->> 'reps')::int,
         coalesce((s ->> 'is_warmup')::boolean, false)
  from jsonb_array_elements(payload -> 'sets') as s;

  if jsonb_typeof(payload -> 'notes') = 'array' then
    insert into workout_exercise_notes (workout_id, exercise_id, note)
    select v_workout_id, (n ->> 'exercise_id')::uuid, n ->> 'note'
    from jsonb_array_elements(payload -> 'notes') as n
    where length(trim(coalesce(n ->> 'note', ''))) > 0;
  end if;

  return v_workout_id;
end;
$$;

revoke all on function public.finish_workout(jsonb) from public, anon;
grant execute on function public.finish_workout(jsonb) to authenticated;

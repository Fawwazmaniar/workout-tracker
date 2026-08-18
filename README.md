# Plateau

A personal workout-tracking app: build a custom training split, log every set, and review your training history — built as a real, daily-use tool rather than a portfolio-only exercise.

## Tech Stack

- **Vite** — build tool / dev server
- **React + TypeScript**
- **React Router v6** — client-side routing
- **Zustand** — client/UI state (auth session, current form selections)
- **TanStack React Query** — server state, caching, mutations
- **Supabase** — Postgres database, Auth, and Row Level Security
- **Radix UI** — accessible, unstyled dialog primitives for all modals

## Architecture Decisions

### Backend: Supabase over a custom API

Supabase gives a real Postgres database, authentication, and an auto-generated API layer without hand-building a backend server. Since there's no server sitting between the frontend and the database, **Row Level Security (RLS) does the job a backend would normally do**: every table that holds user data has RLS enabled, and policies enforce ownership at the database level rather than trusting the frontend to filter correctly. The frontend's Supabase key (`publishable` key) is safe to expose publicly — it grants nothing on its own; the policies are what actually protect the data.

### Data model

- **`profiles`** — extends `auth.users` with an app-specific `role` (`user` | `admin`). A Postgres trigger (`handle_new_user`) automatically creates a `profiles` row whenever someone signs up, so there's never a window where a user exists without a role.
- **`exercises`** — an admin-managed, shared library. Every user can read it; only admins can write to it, enforced by an RLS policy that looks up the requesting user's `role` via a subquery into `profiles`.
- **`training_splits` → `workout_templates` → `workout_template_exercises`** — a user's training program. A split has templates (training days, e.g. "Upper A"); each template has exercises via a junction table, since a day has many exercises and an exercise can appear on many days (a genuine many-to-many relationship). Splits can optionally use `training_split_weeks` to group templates into weeks — a split picks one style (flat days, or days grouped into weeks) at creation time rather than supporting a mixed structure, keeping the UI logic simple.
- **`workouts` → `sets`** — actual logged sessions. A `workout` references which `workout_template` it was based on; `sets` reference the workout and the specific exercise directly (not through the template), so editing a template later never rewrites history — a workout's logged sets always reflect exactly what was actually done, independent of any later changes to the plan.
- **`workout_exercise_notes`** — one optional note per exercise per workout session, enforced via a `unique(workout_id, exercise_id)` constraint rather than left to application-level convention.

Every table follows the same RLS pattern: ownership is checked either directly (`user_id = auth.uid()`) or, for tables nested deeper in the hierarchy, via an `exists (...)` subquery joining back up to the owning row — sometimes through two levels (e.g. `workout_template_exercises` → `workout_templates` → `training_splits`).

### State split: Zustand vs. React Query

The same rule applied throughout: **Zustand owns state the app itself controls** (the authenticated session, current role, in-progress form selections); **React Query owns anything that originates from the server** (exercises, splits, workout history, dashboard stats). Mixing the two — e.g. copying fetched data into local `useState` — was a recurring bug pattern caught during development (stale data that no longer reflects the server after a mutation) and consistently fixed by reading directly from the query/store instead of shadowing it.

### Workout logging: nothing persists until "Finish"

Early versions created a `workouts` row the moment a training day was selected, which left empty, abandoned sessions in the database if a user picked a day and never logged anything. The logging flow was restructured so that **selecting a day only sets local component state** — the actual `workouts` row, its `sets`, and any exercise notes are all created together inside a single mutation triggered by "Finish workout." This trades a small risk (a partial save if one insert in the batch fails, since it isn't wrapped in a database transaction) for a simpler mental model and no orphaned rows on the happy path.

### A recurring Supabase gotcha worth documenting

Any Supabase call that chains `.select()` after an `insert`/`update` — which most of this project's write functions do, in order to return the created/updated row — requires **both** the operation-specific RLS policy (e.g. `insert`) **and** a `select` policy on that table. Without the `select` policy, the write succeeds but the subsequent read-back fails as an RLS violation, surfacing as a confusing "new row violates row-level security policy" error even when the `insert` policy itself is completely correct. This was hit and diagnosed multiple times during development (`exercises`, then `sets`) before becoming a checklist item for every new table.

### Deployment

Hosted on Vercel with GitHub's Git integration for automatic deploys on push to `main`. Two Vercel-specific fixes were needed beyond a standard Vite deploy:
- **A `vercel.json` rewrite rule** (`"/(.*)" → "/index.html"`) so client-side routes (e.g. `/dashboard`, `/splits/:id`) don't 404 on direct navigation or refresh — Vercel's static file server has no knowledge of React Router's client-side routes without this.
- **Environment variables** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) configured directly in Vercel's project settings, since this app — unlike a purely client-side demo — depends on real credentials at build time.

## Known Trade-offs / Possible Follow-ups

- Multi-step writes (e.g. finishing a workout, which inserts a workout row plus many sets and notes) aren't wrapped in a database transaction, so a failure partway through could leave a partial save. Acceptable for a personal-use tool; would need a Postgres function/transaction for stronger guarantees.
- Reordering (of days within a split, or exercises within a day) was deliberately deferred — `day_order`/`exercise_order` exist in the schema, but no drag-and-drop or up/down UI was built, since reordering a training plan is a rare action compared to creating and logging against it.
- Currently a PWA (installable, home-screen icon) rather than a native app. The data and business logic layers are UI-framework-agnostic and would carry over to a React Native rewrite; only the component/styling layer would need to be rebuilt.

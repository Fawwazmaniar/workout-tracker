# Plateau

[![CI](https://github.com/Fawwazmaniar/workout-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Fawwazmaniar/workout-tracker/actions/workflows/ci.yml)

Plateau is a workout tracker. You build a custom training split, log sets during a session, and look back over past sessions. It is a React single-page app talking directly to Supabase (Postgres, Auth and Row Level Security), with no server of its own.

Live: https://workout-tracker-zeta-neon.vercel.app

## Features

- **Auth**: sign up, log in, log out, password reset and change password (Supabase Auth). App pages are behind a route guard.
- **Training split builder**: create, rename and delete splits; add training days to a split; add, swap and remove exercises on a day; choose one split as the active one.
- **Exercise library**: a shared list of exercises grouped by category. Anyone signed in can browse it; the add/edit/delete controls only show for users whose profile role is `admin`.
- **Set logging**: pick a day from the active split, add sets with weight and reps, flag warm-up sets, and write a note per exercise. Nothing is saved until you tap **Finish workout**; leaving mid-workout asks for confirmation.
- **Session history**: the dashboard shows total workouts, workouts in the last 7 days and the 8 most recent sessions. Each session can be opened for details, edited, or deleted.

## Stack

From `package.json`:

- Vite 8, React 19, TypeScript 6
- React Router (`react-router-dom` 7)
- Zustand 5 for app-controlled state
- TanStack React Query 5 for server state
- Supabase (`@supabase/supabase-js`): Postgres, Auth, Row Level Security
- Radix UI Dialog for modals
- ESLint with `typescript-eslint` and the React Hooks rules
- Vitest, React Testing Library, user-event and jsdom for tests

## Architecture

- **Server state vs app state.** Anything that comes from the database (splits, days, exercises, history, dashboard stats) lives in React Query. Zustand holds state the app controls itself: the auth session and role (`useAuthStore`) and whether there is an unsaved workout (`useUnsavedWorkoutStore`). The sets being logged live in the `Log` component's local state, and the pure update and payload-building logic is in `src/lib/workoutLog.ts`.
- **Data access.** All Supabase calls are in `src/lib/*.ts`. Components never call Supabase directly.
- **Ownership is enforced in the database.** With no backend between the browser and Postgres, Row Level Security does that job. The client only uses the project URL and a publishable key. The intended policies are documented in [`supabase/policies.sql`](supabase/policies.sql), which is a reference copy to check against the live project, not something the app applies.
- **Save on Finish, in one transaction.** Selecting a day and entering sets only changes local state. Tapping Finish makes a single `supabase.rpc('finish_workout', { payload })` call. The Postgres function in [`supabase/functions.sql`](supabase/functions.sql) inserts the workout, its sets and its notes in one transaction, using `auth.uid()` for ownership, so a failure rolls everything back. Editing an existing workout (`saveWorkoutEdits`) still uses several separate calls and is not atomic.
- **Lazy routes and error handling.** Route pages are code-split with `React.lazy`. A top-level error boundary shows a text fallback, and the dashboard, log and split screens show an error message when their queries fail.

## Running locally

```bash
git clone https://github.com/Fawwazmaniar/workout-tracker.git
cd workout-tracker
npm ci
cp .env.example .env   # then fill in your Supabase URL and publishable key
npm run dev
```

You need a Supabase project with the tables described in `supabase/policies.sql`, and `supabase/functions.sql` applied (Supabase dashboard, SQL Editor) before **Finish workout** will work.

Other scripts: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build`.

## Testing

```bash
npm run test:run   # single run
npm test           # watch mode
```

Tests use Vitest and React Testing Library. `src/test/setup.ts` replaces the Supabase client with a mock for every test file, so tests never reach a real project. They cover:

- the set-logging helpers (add, edit, delete, validation, payload building) and the date formatter
- the Zustand stores
- the route guards (unauthenticated users are redirected)
- the Log screen: entering weight and reps, warm-up flag and notes; nothing saved before Finish; one save call with the full payload on Finish; load-error state
- the `finishWorkout` RPC call
- the dashboard session list, its empty state and its error state
- the splits list and creating a split
- the error boundary

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests and build on every push and pull request to `main`, using dummy Supabase values.

## Deployment

Hosted on Vercel. `vercel.json` rewrites every path to `/index.html` so client-side routes such as `/dashboard` work on refresh. `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set in the Vercel project settings.

## Trade-offs / Next steps

- Editing a saved workout is not atomic (see Architecture).
- Exercises within a day can be moved up and down, but there is no drag and drop, and days within a split cannot be reordered.
- The app is a web app, not a native one.
- Progress charts and personal records are planned, not built.
- `src/History.tsx` is a static placeholder page behind the `/history` route that nothing links to. Real history is on the dashboard.

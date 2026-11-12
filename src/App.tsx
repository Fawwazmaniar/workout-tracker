import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import './App.css'
import { supabase } from './lib/supabaseClient'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from './lib/useAuthStore';
import { ProtectedRoute, PublicOnlyRoute } from './routeGuards';
import { useUnsavedWorkoutStore } from './lib/useUnsavedWorkoutStore';
import { fetchProfile } from './lib/profile';
import { LuDumbbell, LuHistory, LuLayoutDashboard, LuNotebookPen, LuPower, LuUserRound } from 'react-icons/lu';
import plateauLogo from './assets/plateau-logo.png';
import { NotificationModal } from './shared/NotificationModal.tsx';

// Route-level pages are code-split; each module exposes a named export.
const Signup = lazy(() => import('./Signup').then((m) => ({ default: m.Signup })));
const Login = lazy(() => import('./Login').then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import('./Dashboard').then((m) => ({ default: m.Dashboard })));
const Home = lazy(() => import('./Home').then((m) => ({ default: m.Home })));
const ResetPassword = lazy(() => import('./ResetPassword').then((m) => ({ default: m.ResetPassword })));
const Exercises = lazy(() => import('./components/exercise/Exercises.tsx').then((m) => ({ default: m.Exercises })));
const Log = lazy(() => import('./components/log/Log.tsx').then((m) => ({ default: m.Log })));
const History = lazy(() => import('./History.tsx').then((m) => ({ default: m.History })));
const Profile = lazy(() => import('./Profile.tsx').then((m) => ({ default: m.Profile })));
const Splits = lazy(() => import('./components/split/Splits.tsx').then((m) => ({ default: m.Splits })));
const SplitDetail = lazy(() => import('./components/split/SplitDetail.tsx').then((m) => ({ default: m.SplitDetail })));

type PendingNavigation = { type: 'path'; to: string } | { type: 'logout' };


function App() {
  const { session, setSession } = useAuthStore();
  const { setLoading } = useAuthStore();
  const { setUser } = useAuthStore();
  const { setIsPasswordRecovery } = useAuthStore();
  const { setRole } = useAuthStore();

  const navigate = useNavigate();
  const hasUnsavedProgress = useUnsavedWorkoutStore((state) => state.hasUnsavedProgress);
  const setHasUnsavedProgress = useUnsavedWorkoutStore((state) => state.setHasUnsavedProgress);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);

  const getRole = useCallback(async (id?: string | null) => {
    if (!id) {
      setRole(null);
      return;
    }
    try {
      const profile = await fetchProfile(id);
      setRole(profile.role);
    } catch (e) {
      console.error(e);
      setRole(null);
    }
  }, [setRole]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      getRole(session?.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      getRole(session?.user?.id);
      if (_event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [getRole, setIsPasswordRecovery, setLoading, setSession, setUser]);

  const performLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    navigate('/');
  }

  const handleLogout = () => {
    if (hasUnsavedProgress) {
      setPendingNavigation({ type: 'logout' });
      return;
    }
    performLogout();
  }

  const handleNavClick = (e: React.MouseEvent, to: string) => {
    if (hasUnsavedProgress) {
      e.preventDefault();
      setPendingNavigation({ type: 'path', to });
    }
  }

  const confirmPendingNavigation = () => {
    const pending = pendingNavigation;
    setPendingNavigation(null);
    setHasUnsavedProgress(false);
    if (!pending) return;
    if (pending.type === 'logout') {
      performLogout();
    } else {
      navigate(pending.to);
    }
  }

  const appTabs = [
    { to: '/dashboard', label: 'Dashboard', icon: LuLayoutDashboard },
    { to: '/log', label: 'Log', icon: LuNotebookPen },
    { to: '/exercises', label: 'Exercises', icon: LuDumbbell },
    { to: '/splits', label: 'Splits', icon: LuHistory },
    { to: '/profile', label: 'Profile', icon: LuUserRound },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <img src={plateauLogo} alt="Plateau" className="brand-logo" />
        <nav className="topnav" aria-label="Main navigation">
          {!session && (
            <>
              <NavLink to="/signup" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Signup</NavLink>
              <NavLink to="/login" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Login</NavLink>
            </>
          )}
          {session && (
            <>
              <button className="nav-link logout-btn" onClick={handleLogout} aria-label="Log out" title="Log out">
                <LuPower aria-hidden="true" />
              </button>
            </>
          )}

        </nav>
      </header>
    
      <main className="page-content">
        <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>}></Route>
          <Route path="/" element={<PublicOnlyRoute><Home /></PublicOnlyRoute>}></Route>
          <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>}></Route>
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}></Route>
          <Route path="/reset-password" element={<ResetPassword />}></Route>
          <Route path="/exercises" element={<ProtectedRoute><Exercises /></ProtectedRoute>}></Route>
          <Route path="/log" element={<ProtectedRoute><Log /></ProtectedRoute>}></Route>
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>}></Route>
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>}></Route>
          <Route path="/splits" element={<ProtectedRoute><Splits /></ProtectedRoute>}></Route>
          <Route path="/splits/:splitId" element={<ProtectedRoute><SplitDetail /></ProtectedRoute>}></Route>
        </Routes>
        </Suspense>
      </main>
      {session && (
        <footer className="app-footer">
          <nav className="footer-nav" aria-label="App sections">
            {appTabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={(e) => handleNavClick(e, to)}
                className={({ isActive }) => (isActive ? 'footer-link active' : 'footer-link')}
              >
                <Icon className="footer-icon" aria-hidden="true" />
                <span className="footer-label">{label}</span>
              </NavLink>
            ))}
          </nav>
        </footer>
      )}

      <NotificationModal
        isOpen={!!pendingNavigation}
        onClose={() => setPendingNavigation(null)}
        title="Leave workout in progress?"
        message="You have an unsaved workout log. If you leave now, your progress won't be saved."
        action="leave"
        confirmLabel="Leave"
        onConfirm={confirmPendingNavigation}
      />
    </div>
  )
}

export default App


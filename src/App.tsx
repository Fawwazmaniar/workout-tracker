import { useCallback, useEffect } from 'react'
import './App.css'
import { supabase } from './lib/supabaseClient'
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { Signup } from './Signup';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { useAuthStore } from './lib/useAuthStore';
import { Home } from './Home';
import { ResetPassword } from './ResetPassword';
import { fetchProfile } from './lib/profile';
import { Exercises } from './components/exercise/Exercises.tsx';
import { Log } from './components/log/Log.tsx';
import { History } from './History.tsx';
import { Profile } from './Profile.tsx';
import { LuDumbbell, LuHistory, LuLayoutDashboard, LuNotebookPen, LuPower, LuUserRound } from 'react-icons/lu';
import { Splits } from './components/split/Splits.tsx';
import { SplitDetail } from './components/split/SplitDetail.tsx';
import plateauLogo from './assets/plateau-logo.png';


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuthStore();

  if (loading) return <p>Loading...</p>;
  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuthStore();

  if (loading) return <p>Loading...</p>;
  if (session) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

function App() {
  const { session, setSession } = useAuthStore();
  const { setLoading } = useAuthStore();
  const { setUser } = useAuthStore();
  const { setIsPasswordRecovery } = useAuthStore();
  const { setRole } = useAuthStore();

  const navigate = useNavigate();

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    navigate('/');
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
      </main>
      {session && (
        <footer className="app-footer">
          <nav className="footer-nav" aria-label="App sections">
            {appTabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => (isActive ? 'footer-link active' : 'footer-link')}
              >
                <Icon className="footer-icon" aria-hidden="true" />
                <span className="footer-label">{label}</span>
              </NavLink>
            ))}
          </nav>
        </footer>
      )}
    </div>
  )
}

export default App


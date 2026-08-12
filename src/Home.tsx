import { Link } from 'react-router-dom';
import { LuDumbbell, LuLayers, LuHistory, LuClipboardList } from 'react-icons/lu';

export const Home = () => {
    return (
        <section className="surface-page auth-page">
            <article className="auth-card">
                <p className="login-tag">Workout tracker</p>
                <h1>Train with intent</h1>
                <p className="section-subtitle" style={{ marginBottom: '16px' }}>
                    Built for serious logging: sessions, progression, and discipline in one place.
                </p>
                <div className="topnav">
                    <Link className="primary-btn" to="/signup">
                        Create account
                    </Link>
                    <Link className="nav-link" to="/login">
                        Log in
                    </Link>
                </div>
            </article>

            <article className="surface-card">
                <header className="section-head">
                    <div>
                        <p className="section-title">What you get</p>
                        <p className="section-subtitle">A tool built around how you actually train</p>
                    </div>
                </header>

                <ul className="row-list">
                    <li className="row-item">
                        <div className="row-main">
                            <LuLayers className="row-icon" aria-hidden="true" />
                            <span className="row-text">Build your own training split — days, exercises, your structure</span>
                        </div>
                    </li>
                    <li className="row-item">
                        <div className="row-main">
                            <LuClipboardList className="row-icon" aria-hidden="true" />
                            <span className="row-text">Log every set — weight, reps, warm-ups, and notes per exercise</span>
                        </div>
                    </li>
                    <li className="row-item">
                        <div className="row-main">
                            <LuHistory className="row-icon" aria-hidden="true" />
                            <span className="row-text">Full session history, with detail on every past workout</span>
                        </div>
                    </li>
                    <li className="row-item">
                        <div className="row-main">
                            <LuDumbbell className="row-icon" aria-hidden="true" />
                            <span className="row-text">A growing exercise library, organized by muscle group</span>
                        </div>
                    </li>
                </ul>
            </article>
        </section>
    );
};
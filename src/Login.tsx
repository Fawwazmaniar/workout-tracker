import { useState, type FormEventHandler, type MouseEvent } from "react";
import { supabase } from "./lib/supabaseClient";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import plateauText from "./assets/plateau-text.png";

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordSent, setPasswordSent] = useState(false);

    const navigate = useNavigate();
    const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setError("");

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setError(error.message);
                return;
            }
            navigate("/dashboard");
        } finally {
            setLoading(false);
        }
    }

    const handleReset = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: "https://workout-tracker-zeta-neon.vercel.app/reset-password",
            });
            if (error) {
                setError(error.message);
                return;
            }
            setPasswordSent(true);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="login-page">
            <div className="login-card">
                <img src={plateauText} alt="Plateau" className="plateau-text-mark plateau-text-mark-full" />
                <h1>Log in</h1>

                <form className="login-form" onSubmit={handleSubmit}>
                    <label htmlFor="login-email">Email</label>
                    <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                    />

                    <label htmlFor="login-password">Password</label>
                    <div className="password-input-wrap">
                        <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            className="toggle-password-btn"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <FaEyeSlash className="pw-toggle-icon" /> : <FaEye className="pw-toggle-icon" />}
                        </button>

                    </div>

                    <button type="submit" className="submit-btn" disabled={loading} >
                        {loading ? (
                            <>
                                <span className="spinner" aria-hidden="true" />
                                Signing In...
                            </>
                        ) : (
                            "Start Training"
                        )}
                    </button>
                    <button type="button"  className="reset-btn" onClick={handleReset}>Forgot password</button>
                    {passwordSent && <p className="state-text">Reset Email sent! Please check your email!</p> }
                    {error && <p className="error-text">{error}</p>}
                </form>
            </div>
        </section>
    )
}
import { useState,  type FormEventHandler } from "react"
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { supabase } from "./lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{}\-_=+\\|;:'",.<>/?`~]).{8,}$/;

    const isEmailValid = emailRegex.test(email);
    const isPasswordStrong = strongPasswordRegex.test(password);
    const isPasswordMatch = password === confirmPassword;

    const isFormInvalid = !isEmailValid || !isPasswordStrong || !isPasswordMatch;

    const emailError = email && !isEmailValid ? "Email is invalid" : "";
    const passwordError = password && !isPasswordStrong ? "Password must be 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character" : "";
    const matchError = confirmPassword && !isPasswordMatch ? "Passwords do not match" : "";
    const navigate = useNavigate();

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        if (isFormInvalid || loading) return;

        setLoading(true);
        setError("");

        try {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                setError(error.message);
                return;
            }
            navigate("/dashboard");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="signup-page">
            <div className="signup-card">
                <p className="signup-tag">Workout tracker</p>
                <h1>Create your account</h1>

                <form className="signup-form" onSubmit={handleSubmit}>
                    <label htmlFor="signup-email">Email</label>
                    <input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                    />
                    {emailError && <p className="error-text">{emailError}</p>}

                    <label htmlFor="signup-password">Password</label>
                    <div className="password-input-wrap">
                        <input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            autoComplete="new-password"
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
                        {passwordError && <p className="error-text">{passwordError}</p>}

                    <label htmlFor="signup-confirm-password">Confirm password</label>
                    <div className="password-input-wrap">
                        <input
                            id="signup-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="toggle-password-btn"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                            {showConfirmPassword ? <FaEyeSlash className="pw-toggle-icon" /> : <FaEye className="pw-toggle-icon" />}
                        </button>
                    </div>
                        {matchError && <p className="error-text">{matchError}</p>}

                    <button type="submit" className="submit-btn" disabled={isFormInvalid || loading} >
                        {loading ? (
                            <>
                                <span className="spinner" aria-hidden="true" />
                                Creating account...
                            </>
                        ) : (
                            "Start Training"
                        )}
                    </button>
                    {error && <p className="error-text">{error}</p>}
                </form>
            </div>
        </section>
    )
}
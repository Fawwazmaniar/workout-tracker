import { useState, type FormEventHandler } from "react";
import { useAuthStore } from "./lib/useAuthStore";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { supabase } from "./lib/supabaseClient";
import {NavLink} from 'react-router-dom';
import { FaCircleCheck } from "react-icons/fa6";

export const ResetPassword = () => {
    const { isPasswordRecovery } = useAuthStore();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isResetSuccess, setIsResetSuccess] = useState(false);

    const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{}\-_=+\\|;:'",.<>/?`~]).{8,}$/;

    const isPasswordStrong = strongPasswordRegex.test(password);
    const isPasswordMatch = password === confirmPassword;
    const isFormInvalid = !isPasswordStrong || !isPasswordMatch || !password || !confirmPassword;

    const passwordError =
        password && !isPasswordStrong
            ? "Password must be 8+ chars with uppercase, lowercase, number, and special character."
            : "";
    const matchError = confirmPassword && !isPasswordMatch ? "Passwords do not match." : "";

    if (!isPasswordRecovery) {
        return <p className="auth-only-text">This page is only accessible via a password reset link.</p>;
    }

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        if (loading || isFormInvalid) return;

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                setError(error.message);
                return;
            }

            setIsResetSuccess(true);
            setMessage("Password reset successful.");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="login-page">
            <div className="login-card">
                <p className="login-tag">Workout tracker</p>
                <h1>{isResetSuccess ? "All set" : "New password"}</h1>

                {isResetSuccess ? (
                    <div className="reset-success">
                        <FaCircleCheck className="reset-success-icon" aria-hidden="true" />
                        <p className="state-text">{message}</p>
                        <NavLink to="/login" className="auth-redirect-btn">
                            Go to Login
                        </NavLink>
                    </div>
                ) : (
                    <form className="login-form" onSubmit={handleSubmit}>
                        <label htmlFor="reset-password">Password</label>
                        <div className="password-input-wrap">
                            <input
                                id="reset-password"
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

                        <label htmlFor="reset-confirm-password">Confirm password</label>
                        <div className="password-input-wrap">
                            <input
                                id="reset-confirm-password"
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

                        <button type="submit" className="submit-btn" disabled={isFormInvalid || loading}>
                            {loading ? (
                                <>
                                    <span className="spinner" aria-hidden="true" />
                                    Resetting password...
                                </>
                            ) : (
                                "Reset Password"
                            )}
                        </button>

                        {error && <p className="error-text">{error}</p>}
                    </form>
                )}
            </div>
        </section>
    );
}
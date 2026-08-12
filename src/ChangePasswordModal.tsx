import * as Dialog from "@radix-ui/react-dialog";
import { useState, type FormEventHandler } from "react";
import { LuX } from "react-icons/lu";
import { supabase } from "./lib/supabaseClient";
import { FaEye, FaEyeSlash } from "react-icons/fa";


interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

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


    const handleClose = () => {
        onClose();
    };

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
            e.preventDefault();
            if (loading || isFormInvalid) return;
    
            setLoading(true);
            setError("");
    
            try {
                const { error } = await supabase.auth.updateUser({ password });
    
                if (error) {
                    setError(error.message);
                    return;
                }
    
            } catch {
                setError("Something went wrong. Please try again.");
            } finally {
                setLoading(false);
            }
        };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="modal-overlay" />
                <Dialog.Content className="modal-content">
                    <div className="modal-header">
                        <Dialog.Title>
                            Update password
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button type="button" className="modal-close" aria-label="Close">
                                <LuX />
                            </button>
                        </Dialog.Close>
                    </div>

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

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
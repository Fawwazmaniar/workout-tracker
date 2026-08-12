import { useState } from "react";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { useAuthStore } from "./lib/useAuthStore";

export const Profile = () => {
  const { user, role } = useAuthStore();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const onHandlePasswordChange = () => {
      setIsPasswordModalOpen(true);
  };

  return (
    <section className="surface-page">
      <article className="surface-card">
        <header className="section-head profile-head">
          <div>
            <p className="section-title">Profile</p>
            <p className="section-subtitle">Training preferences and account</p>
          </div>
          <span className="badge">{role ?? 'Athlete'}</span>
        </header>

        <div className="profile-overview">
          <div className="profile-kv-row">
            <span className="profile-kv-label">Email</span>
            <span className="profile-kv-value">{user?.email ?? 'Not available'}</span>
          </div>
          <div className="profile-kv-row">
            <span className="profile-kv-label">Role</span>
            <span className="profile-kv-value">{role ?? 'Athlete'}</span>
          </div>

          <button type="button" className="profile-change-password-btn" onClick={onHandlePasswordChange}>
            Change password
          </button>
        </div>

       </article>

      <ChangePasswordModal 
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
      />
    </section>
  );
};

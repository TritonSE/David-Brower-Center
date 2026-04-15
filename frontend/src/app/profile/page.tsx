"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

import "./AdminProfile.css";

type View = "profile" | "changePassword";

const initialProfile = {
  name: "Jane Doe",
  email: "Janedoe@gmail.com",
  phone: "858-000-000",
  role: "Founder",
};

const emptyPasswordForm = {
  current: "",
  next: "",
  confirm: "",
};

type PasswordField = keyof typeof emptyPasswordForm;
type SignOutReason = "profile" | "password" | null;

function getProfileError(profile: typeof initialProfile) {
  const trimmedName = profile.name.trim();
  const trimmedEmail = profile.email.trim();
  const trimmedPhone = profile.phone.trim();

  if (!/^[a-z\s]+$/i.test(trimmedName)) {
    return "Name can only contain letters and spaces.";
  }

  if (trimmedEmail) {
    const atIndex = trimmedEmail.indexOf("@");
    const dotIndex = trimmedEmail.lastIndexOf(".");
    const hasValidEmail =
      !trimmedEmail.includes(" ") &&
      atIndex > 0 &&
      dotIndex > atIndex + 1 &&
      dotIndex < trimmedEmail.length - 1;

    if (!hasValidEmail) {
      return "Enter a valid email address.";
    }
  }

  if (!/^[0-9-]+$/.test(trimmedPhone)) {
    return "Phone number can only contain numbers and dashes.";
  }

  return null;
}

function normalizeProfile(profile: typeof initialProfile) {
  return {
    ...profile,
    name: profile.name.trim(),
    email: profile.email.trim(),
    phone: profile.phone.trim(),
  };
}

function ProfileMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="account-menu-svg">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.87 0-7 1.79-7 4v1h14v-1c0-2.21-3.13-4-7-4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function StoreMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="account-menu-svg">
      <path
        d="M5 10.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8.5M4 7l1.2-3A1 1 0 0 1 6.13 3h11.74a1 1 0 0 1 .93.63L20 7M4 7a2 2 0 0 0 4 0m0 0a2 2 0 0 0 4 0m0 0a2 2 0 0 0 4 0m0 0a2 2 0 0 0 4 0M9 20v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignOutMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="account-menu-svg">
      <path
        d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 8l4 4-4 4M8 12h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminProfile() {
  const { signOut } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>("profile");
  const [profile, setProfile] = useState(initialProfile);
  const [draftProfile, setDraftProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [focusedPasswordField, setFocusedPasswordField] = useState<PasswordField | null>(null);
  const [passwordToast, setPasswordToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signOutReason, setSignOutReason] = useState<SignOutReason>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function startEditing() {
    setDraftProfile(profile);
    setProfileError(null);
    setIsEditing(true);
  }

  function saveProfile() {
    const nextError = getProfileError(draftProfile);

    if (nextError) {
      setProfileError(nextError);
      return;
    }

    setProfile(normalizeProfile(draftProfile));
    setProfileError(null);
    setIsEditing(false);
  }

  function updateProfileField(key: keyof typeof draftProfile, value: string) {
    const nextProfile = { ...draftProfile, [key]: value };
    setDraftProfile(nextProfile);
    setProfileError(getProfileError(nextProfile));
  }

  function openChangePassword() {
    setPasswordToast(null);
    setPasswordForm(emptyPasswordForm);
    setFocusedPasswordField(null);
    setView("changePassword");
  }

  function isPasswordFormEmpty() {
    return Object.values(passwordForm).every((value) => value.trim() === "");
  }

  function isPasswordFormValid() {
    const { current, next, confirm } = passwordForm;
    return !!current && !!next && !!confirm && next === confirm;
  }

  function isProfileDirty() {
    if (!isEditing) {
      return false;
    }

    const normalizedDraft = normalizeProfile(draftProfile);
    const normalizedProfile = normalizeProfile(profile);

    return (
      normalizedDraft.name !== normalizedProfile.name ||
      normalizedDraft.email !== normalizedProfile.email ||
      normalizedDraft.phone !== normalizedProfile.phone
    );
  }

  function goBackToProfile() {
    if (!isPasswordFormEmpty() && !isPasswordFormValid()) {
      setPasswordToast({
        type: "error",
        message: "Match passwords or clear all fields before going back.",
      });
      return;
    }

    setPasswordToast(null);
    setFocusedPasswordField(null);
    setPasswordForm(emptyPasswordForm);
    setView("profile");
  }

  function handleViewProfile() {
    setIsAccountMenuOpen(false);
    goBackToProfile();
  }

  function updatePasswordField(key: keyof typeof passwordForm, value: string) {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
    if (passwordToast) {
      setPasswordToast(null);
    }
  }

  function savePassword() {
    const { current, next, confirm } = passwordForm;

    if (!current || !next || !confirm || next !== confirm) {
      setPasswordToast({ type: "error", message: "Please save changes" });
      return;
    }

    setPasswordForm(emptyPasswordForm);
    setFocusedPasswordField(null);
    setPasswordToast({ type: "success", message: "Changes have been saved." });
  }

  async function handleSignOut() {
    setIsAccountMenuOpen(false);
    await signOut();
    router.push("/sign-in");
  }

  function requestSignOut() {
    setIsAccountMenuOpen(false);

    if (view === "profile") {
      if (isProfileDirty()) {
        setSignOutReason("profile");
        setShowSignOutConfirm(true);
        return;
      }

      void handleSignOut();
      return;
    }

    if (isPasswordFormEmpty()) {
      void handleSignOut();
      return;
    }

    setSignOutReason("password");
    setShowSignOutConfirm(true);
  }

  return (
    <div className="page">
      <div className="page-top">
        <h1 className="page-title">{view === "profile" ? "Profile" : "Change Password"}</h1>

        <div
          className={`account-dropdown ${isAccountMenuOpen ? "account-dropdown-open" : ""}`}
          ref={dropdownRef}
        >
          <button
            type="button"
            className="account-chip"
            aria-label="Open profile menu"
            aria-expanded={isAccountMenuOpen}
            onClick={() => setIsAccountMenuOpen((open) => !open)}
          >
            <Image
              src="/AdminProfilePngs/small-Maria.png"
              alt="Jane Doe"
              width={32}
              height={32}
              className="account-chip-avatar"
            />
            <span className="account-chip-name">Jane Doe</span>
            <span
              className={`account-chip-caret ${isAccountMenuOpen ? "account-chip-caret-open" : ""}`}
            >
              ⌄
            </span>
          </button>

          {isAccountMenuOpen && (
            <div className="account-menu">
              <div className="account-menu-header">
                <Image
                  src="/AdminProfilePngs/small-Maria.png"
                  alt="Jane Doe"
                  width={32}
                  height={32}
                  className="account-chip-avatar"
                />
                <span className="account-menu-name">Jane Doe</span>
                <span className="account-chip-caret" aria-hidden="true">
                  ⌄
                </span>
              </div>

              <div className="account-menu-divider" />

              <button type="button" className="account-menu-item" onClick={handleViewProfile}>
                <ProfileMenuIcon />
                <span>View Profile</span>
              </button>

              <Link
                href="/manage"
                className="account-menu-item"
                onClick={() => setIsAccountMenuOpen(false)}
              >
                <StoreMenuIcon />
                <span>Manage NPO</span>
              </Link>

              <button type="button" className="account-menu-item" onClick={requestSignOut}>
                <SignOutMenuIcon />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {view === "profile" ? (
        <div className="profile-layout">
          <div className="profile-header">
            <Image
              src="/AdminProfilePngs/big-maria.png"
              alt="Maria"
              width={124}
              height={124}
              className="avatar-large"
              priority
            />

            <div className="profile-text">
              <h2>Maria</h2>
              <p className="role-text">Founder</p>
            </div>
          </div>

          <section className="profile-section">
            <h2 className="section-title">Personal Information</h2>

            <div className="details-grid">
              <div className="detail-row">
                <span className="detail-label">Name</span>
                {isEditing ? (
                  <input
                    className="input"
                    value={draftProfile.name}
                    onChange={(e) => updateProfileField("name", e.target.value)}
                    autoCapitalize="words"
                  />
                ) : (
                  <span className="detail-value">{profile.name}</span>
                )}
              </div>

              <div className="detail-row">
                <span className="detail-label">Email</span>
                {isEditing ? (
                  <input
                    className="input"
                    type="email"
                    value={draftProfile.email}
                    onChange={(e) => updateProfileField("email", e.target.value)}
                    inputMode="email"
                    autoCapitalize="none"
                  />
                ) : (
                  <span className="detail-value">{profile.email}</span>
                )}
              </div>

              <div className="detail-row">
                <span className="detail-label">Phone Number</span>
                {isEditing ? (
                  <input
                    className="input"
                    value={draftProfile.phone}
                    onChange={(e) => updateProfileField("phone", e.target.value)}
                    inputMode="numeric"
                  />
                ) : (
                  <span className="detail-value">{profile.phone}</span>
                )}
              </div>

              <div className="detail-row">
                <span className="detail-label">Role</span>
                {isEditing ? (
                  <input
                    className="input input-readonly"
                    value={profile.role}
                    readOnly
                    tabIndex={-1}
                  />
                ) : (
                  <span className="detail-value">{profile.role}</span>
                )}
              </div>
            </div>

            <div className="section-divider" />

            <div className="password-row">
              <div className="password-meta">
                <span className="detail-label">Password</span>
                <button type="button" className="change-password-link" onClick={openChangePassword}>
                  Change Password?
                </button>
              </div>

              {isEditing ? (
                <div className="password-input-shell" aria-hidden="true">
                  <span className="password-dots">••••••••</span>
                </div>
              ) : (
                <span className="detail-value password-text">••••••••</span>
              )}
            </div>

            {profileError && <p className="form-error">{profileError}</p>}
          </section>

          <button
            type="button"
            className={isEditing ? "save-btn" : "edit-btn"}
            onClick={isEditing ? saveProfile : startEditing}
          >
            {isEditing ? (
              "Save Changes"
            ) : (
              <>
                <span>Edit Profile</span>
                <Image
                  src="/icons/manage/edit.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="edit-button-icon"
                />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="change-password-layout">
          <div className="change-password-form">
            <button type="button" className="back-button" onClick={goBackToProfile}>
              ← Back to Profile
            </button>

            <label className="field-label" htmlFor="current-password">
              Current password
            </label>
            <input
              id="current-password"
              className="input password-input"
              type={focusedPasswordField === "current" ? "text" : "password"}
              value={passwordForm.current}
              onChange={(e) => updatePasswordField("current", e.target.value)}
              onFocus={() => setFocusedPasswordField("current")}
              onBlur={() =>
                setFocusedPasswordField((field) => (field === "current" ? null : field))
              }
            />

            <label className="field-label" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              className="input password-input"
              type={focusedPasswordField === "next" ? "text" : "password"}
              value={passwordForm.next}
              onChange={(e) => updatePasswordField("next", e.target.value)}
              onFocus={() => setFocusedPasswordField("next")}
              onBlur={() => setFocusedPasswordField((field) => (field === "next" ? null : field))}
            />

            <label className="field-label" htmlFor="confirm-password">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              className="input password-input"
              type={focusedPasswordField === "confirm" ? "text" : "password"}
              value={passwordForm.confirm}
              onChange={(e) => updatePasswordField("confirm", e.target.value)}
              onFocus={() => setFocusedPasswordField("confirm")}
              onBlur={() =>
                setFocusedPasswordField((field) => (field === "confirm" ? null : field))
              }
            />

            <button type="button" className="save-btn-inline" onClick={savePassword}>
              Save Changes
            </button>

            {passwordToast && (
              <div className={`toast toast-${passwordToast.type}`} role="status" aria-live="polite">
                <span className="toast-icon" aria-hidden="true">
                  {passwordToast.type === "success" ? "✓" : "×"}
                </span>
                <span className="toast-message">{passwordToast.message}</span>
                <button
                  type="button"
                  className="toast-close"
                  onClick={() => setPasswordToast(null)}
                  aria-label="Close message"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showSignOutConfirm && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sign-out-title"
        >
          <div className="modal-card">
            <h2 id="sign-out-title" className="modal-title">
              Sign Out?
            </h2>
            <p className="modal-text">
              {signOutReason === "profile"
                ? "You have unsaved profile changes. Save changes before signing out, or sign out now and lose them."
                : "You have password changes in progress. If you sign out now, those changes will be lost."}
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-secondary"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  setSignOutReason(null);
                }}
              >
                Stay Here
              </button>
              <button
                type="button"
                className="modal-primary"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  setSignOutReason(null);
                  void handleSignOut();
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

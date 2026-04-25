"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getProfile, updateProfile } from "@/api/profile";
import { signOut } from "@/services/auth";

import "./AdminProfile.css";

type ProfileFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
};

function isValidEmail(value: string): boolean {
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local, domainWithTld] = parts;
  if (!local || /\s/.test(local) || !domainWithTld || /\s/.test(domainWithTld)) return false;
  const lastDot = domainWithTld.lastIndexOf(".");
  if (lastDot <= 0 || lastDot >= domainWithTld.length - 1) return false;
  return true;
}

export default function AdminProfile() {
  type View = "profile" | "changePassword";
  const router = useRouter();

  const [view, setView] = useState<View>("profile");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSavedAt, setProfileSavedAt] = useState<string | null>(null);

  const [activeSidebarItem, setActiveSidebarItem] = useState("Account");
  const [userData, setUserData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
  });

  // change user info states
  const [draftUserInfo, setDraftUserInfo] = useState(userData);
  const [isEditing, setEditing] = useState(false);
  const [showSaveWarning, setShowSaveWarning] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // change password form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSavedAt, setPwSavedAt] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      setIsLoadingProfile(true);
      setProfileError(null);
      try {
        const profile = await getProfile();
        const nextUserData: ProfileFormData = {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone,
          role: profile.role,
        };
        setUserData(nextUserData);
        setDraftUserInfo(nextUserData);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load profile.";
        setProfileError(message);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    void loadProfile();
  }, []);

  function handleUserInfoChange(key: keyof typeof draftUserInfo, value: string) {
    setDraftUserInfo((prev) => ({ ...prev, [key]: value }));
    setShowSaveWarning(false);
    setProfileError(null);
    setProfileSavedAt(null);
  }

  function startEditing() {
    setDraftUserInfo(userData); // set info to latest save data
    setEditing(true);
    setProfileError(null);
    setProfileSavedAt(null);
  }

  async function saveEditing() {
    const normalizedFirstName = draftUserInfo.firstName.trim();
    const normalizedLastName = draftUserInfo.lastName.trim();
    const normalizedEmail = draftUserInfo.email.trim();

    if (!normalizedFirstName || !normalizedLastName || !normalizedEmail) {
      setProfileError("First name, last name, and email are required.");
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setProfileError("Please enter a valid email address.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);

    try {
      const updatedProfile = await updateProfile({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        email: normalizedEmail,
        phone: draftUserInfo.phone.trim(),
      });
      const nextUserData: ProfileFormData = {
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
      };

      setUserData(nextUserData);
      setDraftUserInfo(nextUserData);
      setEditing(false);
      setShowSaveWarning(false);
      setProfileSavedAt(new Date().toLocaleDateString());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save profile changes.";
      setProfileError(message);
    } finally {
      setIsSavingProfile(false);
    }
  }

  function triggerChangePassword() {
    if (isEditing) {
      setShowSaveWarning(true);
      return;
    }
    setPwError("");
    setView("changePassword");
  }

  function backToProfile() {
    setPwError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setView("profile");
  }

  async function confirmSignOut() {
    try {
      await signOut();
      setShowSignOutModal(false);
      router.push("/sign-in");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sign out.";
      setProfileError(message);
    }
  }

  return (
    <div className="page">
      {/* Main card */}
      <div className="card">
        {/* Sidebar */}
        <aside className="sidebar">
          <button
            className={`sidebar-item ${activeSidebarItem === "Account" ? "active" : ""}`}
            onClick={() => setActiveSidebarItem("Account")}
          >
            <Image
              src="/AdminProfilePngs/uil_setting.png"
              alt="settings icon"
              className="sidebar-icon"
              width={20}
              height={20}
            />
            Account
          </button>
          <button
            className={`sidebar-item ${activeSidebarItem === "Manage NPO" ? "active" : ""}`}
            onClick={() => {
              if (isEditing) {
                setShowSaveWarning(true);
                return;
              }
              setActiveSidebarItem("Manage NPO");
            }}
          >
            <Image
              src="/AdminProfilePngs/material-symbols_manage-accounts-rounded.png"
              alt="manage icon"
              className="sidebar-icon"
              width={25}
              height={25}
            />
            Manage NPO
          </button>

          <button
            className="sign-out"
            onClick={() => {
              if (isEditing) {
                setShowSaveWarning(true);
                return;
              }
              setShowSignOutModal(true);
            }}
          >
            <Image
              src="/AdminProfilePngs/material-symbols_logout-rounded.png"
              alt="logout icon"
              className="sidebar-icon"
              width={25}
              height={25}
            />
            Sign Out
          </button>
        </aside>

        {/* Content */}
        <main className="content">
          {view === "profile" ? (
            <>
              <div className="profile-header">
                <div className="profile-image-wrapper">
                  <Image
                    src="/AdminProfilePngs/big-maria.png"
                    alt="profile"
                    width={120}
                    height={120}
                    className="avatar-large"
                    priority
                  />
                </div>

                <div className="profile-text">
                  <h2>{`${userData.firstName} ${userData.lastName}`.trim() || "User"}</h2>
                  <p className="role-text">{userData.role || "Member"}</p>
                </div>
              </div>

              <h3 className="section-title">Personal Information</h3>

              {isLoadingProfile ? <div className="pw-saved">Loading profile...</div> : null}
              {profileError ? <div className="pw-error">{profileError}</div> : null}
              {profileSavedAt ? (
                <div className="pw-saved">Profile updated {profileSavedAt}</div>
              ) : null}

              <div className="form-grid">
                <div>
                  <label>Name</label>
                  {isEditing ? (
                    <div className="name-row">
                      <input
                        className="input"
                        value={draftUserInfo.firstName}
                        onChange={(e) => handleUserInfoChange("firstName", e.target.value)}
                        placeholder="First Name"
                      />
                      <input
                        className="input"
                        value={draftUserInfo.lastName}
                        onChange={(e) => handleUserInfoChange("lastName", e.target.value)}
                        placeholder="Last Name"
                      />
                    </div>
                  ) : (
                    <div className="info-value">
                      {userData.firstName} {userData.lastName}
                    </div>
                  )}
                </div>

                <div>
                  <label>Email</label>
                  {isEditing ? (
                    <input
                      className="input"
                      value={draftUserInfo.email}
                      onChange={(e) => handleUserInfoChange("email", e.target.value)}
                      placeholder="Email"
                    />
                  ) : (
                    <div className="info-value">{userData.email}</div>
                  )}
                </div>

                <div>
                  <label>Phone Number</label>
                  {isEditing ? (
                    <input
                      className="input"
                      value={draftUserInfo.phone}
                      onChange={(e) => handleUserInfoChange("phone", e.target.value)}
                      placeholder="Phone Number"
                    />
                  ) : (
                    <div className="info-value">{userData.phone}</div>
                  )}
                </div>

                <div>
                  <label>Role</label>
                  <div className="info-value">{userData.role || "Member"}</div>
                </div>

                <div>
                  <label>Password</label>
                  <div className="info-value password-field">
                    <span className="password-dots">*******</span>
                    <button
                      type="button"
                      className="change-password-link"
                      onClick={triggerChangePassword}
                    >
                      Change Password?
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <button type="button" className="back-link" onClick={backToProfile}>
                ‹ back
              </button>

              <h3 className="section-title">Change Password</h3>

              <div className="change-password-form">
                <label className="cp-label">Current Password</label>
                <input
                  className="input cp-input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />

                <label className="cp-label">New Password</label>
                <input
                  className="input cp-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <label className="cp-label">Confirm New Password</label>
                <input
                  className="input cp-input"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />

                <button
                  type="button"
                  className="save-changes-btn"
                  onClick={() => {
                    if (!currentPassword || !newPassword || !confirmNewPassword) {
                      setPwError("Please fill out all fields.");
                      return;
                    }
                    if (newPassword !== confirmNewPassword) {
                      setPwError("Please confirm changes");
                      return;
                    }

                    setPwError("");
                    setPwSavedAt(new Date().toLocaleDateString());
                  }}
                >
                  Save Changes
                </button>

                {pwError && <div className="pw-error">{pwError}</div>}
                {pwSavedAt && <div className="pw-saved">Last updated {pwSavedAt}</div>}
              </div>
            </>
          )}
        </main>

        {/* Floating edit button */}
        {isEditing ? (
          <button
            className="save-btn"
            disabled={isSavingProfile}
            onClick={() => void saveEditing()}
          >
            {isSavingProfile ? "Saving..." : "Save changes"}
          </button>
        ) : (
          <button className="edit-btn" disabled={isLoadingProfile} onClick={startEditing}>
            <Image
              src="/AdminProfilePngs/ic_outline-edit.png"
              alt="edit"
              width={20}
              height={20}
              className="edit-icon-base"
            />
            <Image
              src="/AdminProfilePngs/Vector.png"
              alt="pencil"
              width={12}
              height={12}
              className="edit-icon-overlay"
            />
          </button>
        )}

        {showSaveWarning && (
          <div className="save-warning">
            <span>Please save changes</span>
            <button className="close-warning-btn" onClick={() => setShowSaveWarning(false)}>
              x
            </button>
          </div>
        )}

        {/* New change: Sign out confirmation modal */}
        {showSignOutModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2 className="modal-title">Sign Out</h2>

              <p className="modal-description">
                You are signing out of your account. If you do not wish to sign out, please click
                the <strong>Don’t Sign Out</strong> button.
              </p>

              <div className="modal-actions">
                <button className="modal-cancel" onClick={() => setShowSignOutModal(false)}>
                  ✕ Don’t Sign Out
                </button>

                <button
                  className="modal-confirm"
                  onClick={() => {
                    void confirmSignOut();
                  }}
                >
                  ⎋ Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

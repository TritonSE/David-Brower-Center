"use client";

import { useState, useRef, useEffect } from "react";
import "./AdminProfile.css";


export default function AdminProfile() {
  type View = "profile" | "changePassword";

  const [view, setView] = useState<View>("profile");

  const [activeToggle, setActiveToggle] = useState("Admin");
  const [activeSidebarItem, setActiveSidebarItem] = useState("Account");
  const role = "Founder";
  const [userData, setUserData] = useState({
    firstName: "Jane",
    lastName: "Doe",
    email: "Janedoe@gmail.com",
    phone: "858-000-000",
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

  // drop downs states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function handleUserInfoChange(
    key: keyof typeof draftUserInfo,
    value: string
  )
  {
    setDraftUserInfo((prev) => ({...prev, [key]: value}));
    setShowSaveWarning(false);
  }

  function startEditing() {
    setDraftUserInfo(userData); // set info to latest save data
    setEditing(true);
  }

  function saveEditing() {
    setUserData(draftUserInfo); // commit info changes
    setEditing(false);
    setShowSaveWarning(false);
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
  
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsDropdownOpen(false);
    }
  
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);
  
  function guardNavigation() {
    if (isEditing) {
      setShowSaveWarning(true);
      return false;
    }
    return true;
  }
  
  return (
    <div className="page">
      {/* Top toggle bar */}
      <div className="top-bar">
        <div className="toggle">
          <span
            className={activeToggle === "Graph" ? "active" : ""}
            onClick={() => {
              if (isEditing) {
                setShowSaveWarning(true);
                return;
              }
            setActiveToggle("Graph")
            }}
          >
            Graph
          </span>
          <span
            className={activeToggle === "List" ? "active" : ""}
            onClick={() => {
              if (isEditing) {
                setShowSaveWarning(true);
                return;
              }
            setActiveToggle("List")
            }}
          >
            List
          </span>
          <span
            className={activeToggle === "Admin" ? "active" : ""}
            onClick={() => {
              if (isEditing) {
                setShowSaveWarning(true);
                return;
              }
              setActiveToggle("Admin")
            }}
          >
            Admin
          </span>
        </div>

        {/* Mini sidebar (static, no dropdown action) */}
        <div
          className={`mini-sidebar-wrapper ${isDropdownOpen ? "dropdown-open" : ""}`}
          ref={dropdownRef}
        >
          <button
            type="button"
            className={`mini-sidebar ${isDropdownOpen ? "mini-sidebar-open" : ""}`}
            onClick={() => setIsDropdownOpen((v) => !v)}
          >
            <img
              src="/small-Maria.png"
              alt="user"
              className="mini-sidebar-avatar"
            />
            <span className="user-name">Jane Doe</span>
            <span className={`dropdown-caret ${isDropdownOpen ? "dropdown-caret-up" : ""}`}>
              ▼
            </span>
          </button>

          {isDropdownOpen && (
            <div className="dropdown-panel">
              <div className="dropdown-header">
                <img
                  src="/small-Maria.png"
                  alt="user"
                  className="dropdown-header-avatar"
                />
                <span className="dropdown-header-name">Jane Doe</span>
              </div>

              <hr className="dropdown-divider" />

              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  if (!guardNavigation()) return;
                  setView("profile");
                  setActiveSidebarItem("Account");
                  setIsDropdownOpen(false);
                }}
              >
                <img src="/gg_profile.png" className="dropdown-item-icon" alt="" />
                View Account
              </button>

              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  if (!guardNavigation()) return;
                  setView("profile");
                  setActiveSidebarItem("Manage NPO");
                  setIsDropdownOpen(false);
                }}
              >
                <img src="/material-symbols_manage-accounts-rounded.png" className="dropdown-item-icon" alt="" />
                Manage NPO
              </button>

              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  if (!guardNavigation()) return;
                  setIsDropdownOpen(false);
                  setShowSignOutModal(true);
                }}
              >
                <img src="/material-symbols_logout-rounded.png" className="dropdown-item-icon" alt="" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main card */}
      <div className="card">
        {/* Sidebar */}
        <aside className="sidebar">
          <button
            className={`sidebar-item ${activeSidebarItem === "Account" ? "active" : ""}`}
            onClick={() => setActiveSidebarItem("Account")}
          >
            <img
              src="/uil_setting.png"
              alt="settings icon"
              className="sidebar-icon"
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
            <img
              src="/material-symbols_manage-accounts-rounded.png"
              alt="manage icon"
              className="sidebar-icon"
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
            <img
              src="/material-symbols_logout-rounded.png"
              alt="logout icon"
              className="sidebar-icon"
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
                  <img className="avatar-large" src="/big-maria.png" alt="profile" />
                </div>
                <div className="profile-text">
                  <h2>Maria</h2>
                  <p className="role-text">{role}</p>
                </div>
              </div>

              <h3 className="section-title">Personal Information</h3>

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
                  <div className="info-value">{role}</div>
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
            onClick={saveEditing}
          >
            Save changes
          </button>
        ): (
          <button 
            className="edit-btn"
            onClick={startEditing}
          >
            <img src="/ic_outline-edit.png" alt="edit" className="edit-icon-base" />
            <img src="/Vector.png" alt="pencil" className="edit-icon-overlay" />
          </button>
        )}

        {showSaveWarning && (
          <div className="save-warning">
            <span>Please save changes</span>
            <button
              className="close-warning-btn"
              onClick={() => setShowSaveWarning(false)}
            >
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
                You are signing out of your account. If you do not wish to sign out,
                please click the <strong>Don’t Sign Out</strong> button.
              </p>

              <div className="modal-actions">
                <button
                  className="modal-cancel"
                  onClick={() => setShowSignOutModal(false)}
                >
                  ✕ Don’t Sign Out
                </button>

                <button
                  className="modal-confirm"
                  onClick={() => {
                    // TODO: implement what happens when user confirms sign out (e.g. clear auth tokens, redirect to login page, etc.)
                    console.log("Signing out...");
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

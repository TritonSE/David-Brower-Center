"use client";

import { useState } from "react";
import "./AdminProfile.css";

export default function AdminProfile() {
  const [activeToggle, setActiveToggle] = useState("Admin");
  const [activeSidebarItem, setActiveSidebarItem] = useState("Profile");
  const role = "Founder";
  const [userData, setUserData] = useState({
    firstName: "Jane",
    lastName: "Doe",
    email: "Janedoe@gmail.com",
    phone: "858-000-000",
  });
  return (
    <div className="page">
      {/* Top toggle bar */}
      <div className="top-bar">
        <div className="toggle">
          <span
            className={activeToggle === "Graph" ? "active" : ""}
            onClick={() => setActiveToggle("Graph")}
          >
            Graph
          </span>
          <span
            className={activeToggle === "List" ? "active" : ""}
            onClick={() => setActiveToggle("List")}
          >
            List
          </span>
          <span
            className={activeToggle === "Admin" ? "active" : ""}
            onClick={() => setActiveToggle("Admin")}
          >
            Admin
          </span>
        </div>

        {/* Mini sidebar (static, no dropdown action) */}
        <div className="mini-sidebar-wrapper">
          <div className="mini-sidebar">
            <img src="/small-Maria.png" alt="user" className="mini-sidebar-avatar" />
            <span className="user-name">Jane Doe</span>
            <span className="dropdown-caret">▼</span>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="card">
        {/* Sidebar */}
        <aside className="sidebar">
          <button
            className={`sidebar-item ${activeSidebarItem === "Profile" ? "active" : ""}`}
            onClick={() => setActiveSidebarItem("Profile")}
          >
            <img src="/gg_profile.png" alt="profile icon" className="sidebar-icon" />
            Profile
          </button>
          <button
            className={`sidebar-item ${activeSidebarItem === "Manage NPO" ? "active" : ""}`}
            onClick={() => setActiveSidebarItem("Manage NPO")}
          >
            <img
              src="/material-symbols_manage-accounts-rounded.png"
              alt="manage icon"
              className="sidebar-icon"
            />
            Manage NPO
          </button>

          <button className="sign-out">
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
              <div className="info-value">
                {userData.firstName} {userData.lastName}
              </div>
            </div>
            <div>
              <label>Email</label>
              <div className="info-value">{userData.email}</div>
            </div>
            <div>
              <label>Phone Number</label>
              <div className="info-value">{userData.phone}</div>
            </div>
            <div>
              <label>Role</label>
              <div className="info-value">{role}</div>
            </div>
            <div>
              <label>Password</label>
              <div className="info-value password-field">
                <span className="password-dots">*******</span>
                <a href="#" className="change-password-link">
                  Change Password?
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* Floating edit button */}
        <button className="edit-btn">
          <img src="/ic_outline-edit.png" alt="edit" className="edit-icon-base" />
          <img src="/Vector.png" alt="pencil" className="edit-icon-overlay" />
        </button>
      </div>
    </div>
  );
}

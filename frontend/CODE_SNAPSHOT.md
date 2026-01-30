# Code Snapshot (Prior to This Moment)

This file contains the full code for the Admin Profile page and its styles as they currently exist in the project.

---

## `src/app/page.tsx`

```tsx
"use client";

import { useState } from "react";
import "./AdminProfile.css";

export default function AdminProfile() {
  const [activeToggle, setActiveToggle] = useState("Admin");
  const [activeSidebarItem, setActiveSidebarItem] = useState("Profile");

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
        <img className="avatar-small" src="/small-Maria.png" alt="user" />
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
            className={`sidebar-item ${activeSidebarItem === "Account Settings" ? "active" : ""}`}
            onClick={() => setActiveSidebarItem("Account Settings")}
          >
            <img src="/uil_setting.png" alt="settings icon" className="sidebar-icon" />
            Account Settings
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
            <img className="avatar-large" src="/big-maria.png" alt="profile" />
            <div className="profile-text">
              <h2>Maria</h2>
              <p>Founder</p>
            </div>
          </div>

          <h3 className="section-title">Personal Information</h3>

          <div className="form-grid">
            <div>
              <label>First Name</label>
              <input />
            </div>
            <div>
              <label>Last Name</label>
              <input />
            </div>
            <div>
              <label>Email</label>
              <input />
            </div>
            <div>
              <label>Phone Number</label>
              <input />
            </div>
            <div>
              <label>Role</label>
              <input />
            </div>
          </div>
        </main>

        {/* Floating edit button */}
        <button className="edit-btn">
          <img src="/ic_outline-edit.png" alt="edit" />
        </button>
      </div>
    </div>
  );
}
```

---

## `src/app/AdminProfile.css`

```css
/* Page background */
.page {
  min-height: 100vh;
  background: #f4faf9;
  padding: 24px;
  font-family: system-ui, sans-serif;
}

/* Top bar */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* Toggle pill */
.toggle {
  display: flex;
  background: white;
  border-radius: 999px;
  padding: 4px;
  gap: 4px;
}

.toggle span {
  padding: 8px 16px;
  font-size: 14px;
  color: #888;
  border-radius: 999px;
}

.toggle .active {
  background: #3b9c9c;
  color: white;
}

/* Main card */
.card {
  display: flex;
  position: relative;
  background: white;
  border-radius: 24px;
  min-height: 80vh;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 345px;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
}

.sidebar-item {
  padding: 14px 24px;
  color: #888;
  cursor: pointer;
}

.sidebar-item.active {
  background: #3b9c9c;
  color: white;
  border-radius: 0 12px 12px 0;
}

.sign-out {
  margin-top: auto;
  padding: 24px;
  color: #777;
}

/* Content area */
.content {
  flex: 1;
  padding: 48px 64px;
  padding-left: 120px; /* 👈 nudges content right like final */
}

/* Profile header */
.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 32px;
  margin-bottom: 56px;
}

.avatar-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin-bottom: 16px;
}

.profile-header h2 {
  margin: 0;
}

.profile-header p {
  margin: 4px 0 0;
  color: #3b9c9c;
}

/* Section title */
.section-title {
  text-align: center;
  margin-bottom: 32px;
  color: #888;
}

/* Form grid */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px 32px;
  max-width: 700px;
  margin: 0 auto;
}

.form-grid div {
  display: flex;
  flex-direction: column;
}

label {
  font-size: 13px;
  color: #888;
  margin-bottom: 6px;
}

input {
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 8px;
}

/* Small avatar */
.avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

/* Mini sidebar dropdown */
.mini-sidebar-wrapper {
  position: relative;
}

.mini-sidebar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: white;
  border-radius: 999px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: fit-content;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font: inherit;
  color: inherit;
  box-sizing: border-box;
}

.mini-sidebar:hover,
.mini-sidebar.mini-sidebar-open {
  background: #3b9c9c;
  border-color: #3b9c9c;
  box-shadow: 0 2px 8px rgba(59, 156, 156, 0.3);
}

.mini-sidebar.mini-sidebar-open {
  width: 176px;
  min-width: 176px;
  height: 56px;
  border-radius: 999px;
}

.mini-sidebar-wrapper.dropdown-open {
  width: 176px;
}

.mini-sidebar:hover .user-name,
.mini-sidebar.mini-sidebar-open .user-name {
  color: white;
}

.mini-sidebar:hover .dropdown-caret,
.mini-sidebar.mini-sidebar-open .dropdown-caret {
  color: white;
}

.user-name {
  color: #3b9c9c;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: color 0.3s ease;
}

.dropdown-caret {
  color: #3b9c9c;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.dropdown-caret-up {
  transform: rotate(180deg);
}

.dropdown-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  width: 176px;
  height: 132px;
  min-width: 176px;
  box-sizing: border-box;
  background: white;
  border-radius: 12px;
  border: 1px solid #ddd;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  z-index: 99;
}

.dropdown-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  text-align: left;
  transition: background 0.2s ease;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item-selected {
  background: #3b9c9c;
  color: white;
}

.dropdown-item-selected .dropdown-item-icon-placeholder {
  background: rgba(255, 255, 255, 0.5);
}

.dropdown-item-icon-placeholder {
  display: inline-block;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  background: #e0e0e0;
  border-radius: 4px;
}

/* Floating edit button */
.edit-btn {
  position: absolute;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: #3b9c9c;
  color: white;
  font-size: 20px;
  cursor: pointer;
}
button {
  all: unset;
  cursor: pointer;
}
```

---

## Other relevant files

- **`src/app/layout.tsx`** – Root layout (Geist fonts, metadata).
- **`src/app/globals.css`** – Tailwind + root CSS variables.
- **`public/`** – Images: `big-maria.png`, `small-Maria.png`, `gg_profile.png`, `uil_setting.png`, `material-symbols_manage-accounts-rounded.png`, `material-symbols_logout-rounded.png`, `ic_outline-edit.png`, `Vector.png`.

---

## Note

`page.tsx` currently uses a simple top-bar avatar (`avatar-small`) and does not render the mini-sidebar (Jane Doe + dropdown). `AdminProfile.css` already includes styles for `.mini-sidebar-wrapper`, `.mini-sidebar`, `.dropdown-panel`, etc., so you can add the corresponding JSX in `page.tsx` when you want that UI.

To see older versions of these files, use Git:  
`git log -p -- frontend/src/app/page.tsx frontend/src/app/AdminProfile.css`

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { getProfile, type Profile, updateProfile } from "@/api/profile";
import { isAbortError } from "@/api/request";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";

import "./AdminProfile.css";

const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  role: "",
};

const emptyPasswordForm = {
  current: "",
  next: "",
  confirm: "",
};

const defaultProfilePhotoSrc = "/AdminProfilePngs/big-maria.png";
const photoCropStage = {
  width: 520,
  height: 230,
  cropSize: 210,
};
const minPhotoZoom = 1;
const maxPhotoZoom = 2.5;

type ProfileForm = typeof emptyProfile;
type PasswordField = keyof typeof emptyPasswordForm;
type SignOutReason = "profile" | "password" | null;
type PhotoPosition = { x: number; y: number };
type PhotoSize = { width: number; height: number };

function getProfileError(profile: ProfileForm) {
  const trimmedName = profile.name.trim();
  const trimmedEmail = profile.email.trim();
  const trimmedPhone = profile.phone.trim();

  if (!trimmedName) {
    return "Name is required.";
  }
  if (!/^[a-z\s]+$/i.test(trimmedName)) {
    return "Name can only contain letters and spaces.";
  }
  if (!trimmedName.replace(/\s+/g, " ").includes(" ")) {
    return "Enter both a first and last name.";
  }

  if (!trimmedEmail) {
    return "Email is required.";
  }
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

  if (trimmedPhone && !/^[0-9-]+$/.test(trimmedPhone)) {
    return "Phone number can only contain numbers and dashes.";
  }

  return null;
}

function normalizeProfile(profile: ProfileForm) {
  return {
    ...profile,
    name: profile.name.trim().replace(/\s+/g, " "),
    email: profile.email.trim(),
    phone: profile.phone.trim(),
  };
}

function profileToForm(profile: Profile): ProfileForm {
  const combinedName = [profile.firstName, profile.lastName]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(" ");
  return {
    name: combinedName,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
  };
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const collapsed = fullName.trim().replace(/\s+/g, " ");
  const firstSpace = collapsed.indexOf(" ");
  if (firstSpace === -1) {
    return { firstName: collapsed, lastName: "" };
  }
  return {
    firstName: collapsed.slice(0, firstSpace),
    lastName: collapsed.slice(firstSpace + 1),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPhotoBounds(naturalWidth: number, naturalHeight: number, zoom: number) {
  const baseScale = Math.max(
    photoCropStage.cropSize / naturalWidth,
    photoCropStage.cropSize / naturalHeight,
  );
  const scale = baseScale * zoom;
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const cropLeft = (photoCropStage.width - photoCropStage.cropSize) / 2;
  const cropTop = (photoCropStage.height - photoCropStage.cropSize) / 2;

  return {
    width,
    height,
    cropLeft,
    cropTop,
    minX: cropLeft + photoCropStage.cropSize - width,
    maxX: cropLeft,
    minY: cropTop + photoCropStage.cropSize - height,
    maxY: cropTop,
  };
}

function clampPhotoPosition(position: PhotoPosition, naturalSize: PhotoSize, zoom: number) {
  const bounds = getPhotoBounds(naturalSize.width, naturalSize.height, zoom);

  return {
    x: clamp(position.x, bounds.minX, bounds.maxX),
    y: clamp(position.y, bounds.minY, bounds.maxY),
  };
}

function getCenteredPhotoPosition(naturalSize: PhotoSize, zoom: number) {
  const bounds = getPhotoBounds(naturalSize.width, naturalSize.height, zoom);

  return clampPhotoPosition(
    {
      x: (photoCropStage.width - bounds.width) / 2,
      y: (photoCropStage.height - bounds.height) / 2,
    },
    naturalSize,
    zoom,
  );
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
  const { signOut, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoPreviewRef = useRef<HTMLImageElement>(null);
  const photoDragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [profilePhotoSrc, setProfilePhotoSrc] = useState(defaultProfilePhotoSrc);
  const [draftProfile, setDraftProfile] = useState<ProfileForm>(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPasswordSuccessOpen, setIsPasswordSuccessOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isPhotoSuccessOpen, setIsPhotoSuccessOpen] = useState(false);
  const [photoDraftSrc, setPhotoDraftSrc] = useState<string | null>(null);
  const [photoNaturalSize, setPhotoNaturalSize] = useState<PhotoSize | null>(null);
  const [photoPosition, setPhotoPosition] = useState<PhotoPosition>({ x: 0, y: 0 });
  const [photoZoom, setPhotoZoom] = useState(minPhotoZoom);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
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
  const activeProfile = isEditing ? draftProfile : profile;

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (!user) {
      setIsProfileLoading(false);
      return;
    }

    const abortController = new AbortController();
    let cancelled = false;

    setIsProfileLoading(true);
    setLoadError(null);

    getProfile(abortController.signal)
      .then((apiProfile) => {
        if (cancelled) return;
        const form = profileToForm(apiProfile);
        setProfile(form);
        setDraftProfile(form);
      })
      .catch((error: unknown) => {
        if (cancelled || isAbortError(error)) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load profile.");
      })
      .finally(() => {
        if (!cancelled) setIsProfileLoading(false);
      });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [user, isAuthLoading]);

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

  useEffect(() => {
    if (!isDraggingPhoto || !photoNaturalSize) {
      return;
    }
    const naturalSize = photoNaturalSize;

    function handleMouseMove(event: MouseEvent) {
      if (!photoDragRef.current) {
        return;
      }

      const deltaX = event.clientX - photoDragRef.current.startX;
      const deltaY = event.clientY - photoDragRef.current.startY;

      setPhotoPosition(
        clampPhotoPosition(
          {
            x: photoDragRef.current.originX + deltaX,
            y: photoDragRef.current.originY + deltaY,
          },
          naturalSize,
          photoZoom,
        ),
      );
    }

    function handleMouseUp() {
      photoDragRef.current = null;
      setIsDraggingPhoto(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingPhoto, photoNaturalSize, photoZoom]);

  function startEditing() {
    setDraftProfile(profile);
    setProfileError(null);
    setIsEditing(true);
  }

  async function saveProfile() {
    if (isSaving) return;

    const nextError = getProfileError(draftProfile);
    if (nextError) {
      setProfileError(nextError);
      return;
    }

    const normalized = normalizeProfile(draftProfile);
    const { firstName, lastName } = splitName(normalized.name);

    setIsSaving(true);
    setProfileError(null);

    try {
      const updated = await updateProfile({
        firstName,
        lastName,
        email: normalized.email,
        phone: normalized.phone,
      });
      const form = profileToForm(updated);
      setProfile(form);
      setDraftProfile(form);
      setIsEditing(false);
    } catch (error: unknown) {
      setProfileError(error instanceof Error ? error.message : "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  function updateProfileField(key: keyof typeof draftProfile, value: string) {
    const nextProfile = { ...draftProfile, [key]: value };
    setDraftProfile(nextProfile);
    setProfileError(getProfileError(nextProfile));
  }

  function resetPhotoEditor() {
    setPhotoDraftSrc(null);
    setPhotoNaturalSize(null);
    setPhotoPosition({ x: 0, y: 0 });
    setPhotoZoom(minPhotoZoom);
    setIsDraggingPhoto(false);
    photoDragRef.current = null;
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function openPhotoEditor() {
    setIsAccountMenuOpen(false);
    setIsPhotoSuccessOpen(false);
    resetPhotoEditor();
    setIsPhotoModalOpen(true);
  }

  function closePhotoEditor() {
    resetPhotoEditor();
    setIsPhotoModalOpen(false);
  }

  function handlePhotoFile(file?: File) {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDraftSrc(typeof reader.result === "string" ? reader.result : null);
      setPhotoNaturalSize(null);
      setPhotoPosition({ x: 0, y: 0 });
      setPhotoZoom(minPhotoZoom);
    };
    reader.readAsDataURL(file);
  }

  function handlePhotoInputChange(event: ChangeEvent<HTMLInputElement>) {
    handlePhotoFile(event.target.files?.[0]);
  }

  function handlePhotoDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    handlePhotoFile(event.dataTransfer.files?.[0]);
  }

  function handlePhotoPreviewLoad(event: SyntheticEvent<HTMLImageElement>) {
    const nextNaturalSize = {
      width: event.currentTarget.naturalWidth,
      height: event.currentTarget.naturalHeight,
    };

    setPhotoNaturalSize(nextNaturalSize);
    setPhotoPosition(getCenteredPhotoPosition(nextNaturalSize, minPhotoZoom));
    setPhotoZoom(minPhotoZoom);
  }

  function updatePhotoZoom(nextZoom: number) {
    const clampedZoom = clamp(nextZoom, minPhotoZoom, maxPhotoZoom);

    if (!photoNaturalSize) {
      setPhotoZoom(clampedZoom);
      return;
    }

    const currentBounds = getPhotoBounds(
      photoNaturalSize.width,
      photoNaturalSize.height,
      photoZoom,
    );
    const nextBounds = getPhotoBounds(photoNaturalSize.width, photoNaturalSize.height, clampedZoom);
    const centerX = photoPosition.x + currentBounds.width / 2;
    const centerY = photoPosition.y + currentBounds.height / 2;

    setPhotoZoom(clampedZoom);
    setPhotoPosition(
      clampPhotoPosition(
        {
          x: centerX - nextBounds.width / 2,
          y: centerY - nextBounds.height / 2,
        },
        photoNaturalSize,
        clampedZoom,
      ),
    );
  }

  function beginPhotoDrag(event: ReactMouseEvent<HTMLDivElement>) {
    if (!photoDraftSrc || !photoNaturalSize) {
      return;
    }

    event.preventDefault();
    photoDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: photoPosition.x,
      originY: photoPosition.y,
    };
    setIsDraggingPhoto(true);
  }

  function savePhotoChanges() {
    if (!photoDraftSrc || !photoNaturalSize || !photoPreviewRef.current) {
      return;
    }

    const outputSize = 320;
    const bounds = getPhotoBounds(photoNaturalSize.width, photoNaturalSize.height, photoZoom);
    const scaleToCanvas = outputSize / photoCropStage.cropSize;
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.beginPath();
    context.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    context.closePath();
    context.clip();
    context.drawImage(
      photoPreviewRef.current,
      (photoPosition.x - bounds.cropLeft) * scaleToCanvas,
      (photoPosition.y - bounds.cropTop) * scaleToCanvas,
      bounds.width * scaleToCanvas,
      bounds.height * scaleToCanvas,
    );

    setProfilePhotoSrc(canvas.toDataURL("image/png"));
    setIsPhotoModalOpen(false);
    resetPhotoEditor();
    setIsPhotoSuccessOpen(true);
  }

  function openChangePassword() {
    setIsAccountMenuOpen(false);
    setPasswordToast(null);
    setPasswordForm(emptyPasswordForm);
    setFocusedPasswordField(null);
    setIsPasswordSuccessOpen(false);
    setIsPasswordModalOpen(true);
  }

  function isPasswordFormEmpty() {
    return Object.values(passwordForm).every((value) => value.trim() === "");
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

  function closeChangePassword() {
    setPasswordToast(null);
    setFocusedPasswordField(null);
    setPasswordForm(emptyPasswordForm);
    setIsPasswordSuccessOpen(false);
    setIsPasswordModalOpen(false);
  }

  function handleViewProfile() {
    setIsAccountMenuOpen(false);
    if (isPhotoModalOpen) {
      closePhotoEditor();
    }
    if (isPhotoSuccessOpen) {
      setIsPhotoSuccessOpen(false);
    }
    if (isPasswordModalOpen) {
      closeChangePassword();
    }
  }

  function updatePasswordField(key: keyof typeof passwordForm, value: string) {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
    if (passwordToast) {
      setPasswordToast(null);
    }
  }

  function savePassword() {
    const { current, next, confirm } = passwordForm;

    if (next && confirm && next !== confirm) {
      setPasswordToast({ type: "error", message: "Passwords do not match." });
      return;
    }

    if (!current || !next || !confirm) {
      if (current || next || confirm) {
        setPasswordToast({ type: "error", message: "Please finish filling out the fields." });
      }
      return;
    }

    setPasswordForm(emptyPasswordForm);
    setFocusedPasswordField(null);
    setPasswordToast(null);
    setIsPasswordModalOpen(false);
    setIsPasswordSuccessOpen(true);
  }

  async function handleSignOut() {
    setIsAccountMenuOpen(false);
    setIsPhotoModalOpen(false);
    setIsPhotoSuccessOpen(false);
    await signOut();
    router.push("/signIn");
  }

  function requestSignOut() {
    setIsAccountMenuOpen(false);

    if (!isPasswordModalOpen && !isPhotoModalOpen && !isPhotoSuccessOpen) {
      if (isProfileDirty()) {
        setSignOutReason("profile");
        setShowSignOutConfirm(true);
        return;
      }

      void handleSignOut();
      return;
    }

    if (
      isPhotoModalOpen ||
      isPhotoSuccessOpen ||
      isPasswordModalOpen ||
      isPasswordSuccessOpen ||
      isPasswordFormEmpty()
    ) {
      void handleSignOut();
      return;
    }

    setSignOutReason("password");
    setShowSignOutConfirm(true);
  }

  return (
    <div className="page">
      <div className="page-top">
        <Navbar isSignedIn defaultView="admin" className="profile-nav" />

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
              src={profilePhotoSrc}
              alt={activeProfile.name}
              width={32}
              height={32}
              className="account-chip-avatar"
              unoptimized
            />
            <span className="account-chip-name">{activeProfile.name}</span>
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
                  src={profilePhotoSrc}
                  alt={activeProfile.name}
                  width={32}
                  height={32}
                  className="account-chip-avatar"
                  unoptimized
                />
                <span className="account-menu-name">{activeProfile.name}</span>
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

              <Link
                href="/accountRequests"
                className="account-menu-item"
                onClick={() => setIsAccountMenuOpen(false)}
              >
                <ProfileMenuIcon />
                <span>Account Requests</span>
              </Link>

              <button type="button" className="account-menu-item" onClick={requestSignOut}>
                <SignOutMenuIcon />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <section className="profile-card">
        <div className="profile-card-inner">
          <div className="profile-hero">
            <div className="profile-avatar-shell">
              <Image
                src={profilePhotoSrc}
                alt={activeProfile.name}
                width={100}
                height={100}
                className="avatar-large"
                unoptimized
              />
              {isEditing && (
                <button
                  type="button"
                  className="avatar-edit-badge"
                  aria-label="Edit profile photo"
                  onClick={openPhotoEditor}
                >
                  <Image src="/AdminProfilePngs/Vector.png" alt="" width={18} height={18} />
                </button>
              )}
            </div>

            <div className="profile-text">
              <h1>{activeProfile.name}</h1>
              <p className="role-text">{profile.role}</p>
            </div>
          </div>

          <section className="profile-section">
            <div className="section-heading">
              <h2 className="section-title">Personal Information</h2>

              {!isEditing && !isProfileLoading && !loadError && (
                <button type="button" className="edit-inline-btn" onClick={startEditing}>
                  <span>Edit Profile</span>
                  <Image
                    src="/AdminProfilePngs/Vector.png"
                    alt=""
                    width={16}
                    height={16}
                    className="edit-inline-icon"
                  />
                </button>
              )}
            </div>

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

            {(profileError ?? loadError) && (
              <p className="form-error">{profileError ?? loadError}</p>
            )}

            {isEditing && (
              <div className="profile-actions">
                <button
                  type="button"
                  className="save-btn save-btn-card"
                  onClick={() => void saveProfile()}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )}
          </section>
        </div>
      </section>

      {isPasswordModalOpen && (
        <div
          className="password-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-title"
        >
          <div className="password-modal-card">
            <div className="password-modal-header">
              <h2 id="change-password-title" className="password-modal-title">
                Change Password
              </h2>
              <button
                type="button"
                className="password-modal-close"
                onClick={closeChangePassword}
                aria-label="Close change password"
              >
                ×
              </button>
            </div>

            <div className="password-modal-form">
              <label className="field-label" htmlFor="current-password">
                Current password
              </label>
              <input
                id="current-password"
                className="input password-input password-modal-input"
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
                className="input password-input password-modal-input"
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
                className="input password-input password-modal-input"
                type={focusedPasswordField === "confirm" ? "text" : "password"}
                value={passwordForm.confirm}
                onChange={(e) => updatePasswordField("confirm", e.target.value)}
                onFocus={() => setFocusedPasswordField("confirm")}
                onBlur={() =>
                  setFocusedPasswordField((field) => (field === "confirm" ? null : field))
                }
              />

              {passwordToast && (
                <div
                  className={`toast toast-${passwordToast.type}`}
                  role="status"
                  aria-live="polite"
                >
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

              <div className="password-modal-actions">
                <button
                  type="button"
                  className="save-btn-inline password-modal-save"
                  onClick={savePassword}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPasswordSuccessOpen && (
        <div
          className="password-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-success-title"
        >
          <div className="password-modal-card password-success-card">
            <h2 id="password-success-title" className="password-success-title">
              Password Changed
            </h2>
            <p className="password-success-text">You have successfully changed your password!</p>
            <div className="password-success-icon" aria-hidden="true">
              ✓
            </div>
            <div className="password-success-actions">
              <button
                type="button"
                className="save-btn-inline password-success-button"
                onClick={closeChangePassword}
              >
                Back to profile
              </button>
            </div>
          </div>
        </div>
      )}

      {isPhotoModalOpen && (
        <div
          className="password-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-photo-title"
        >
          <div className="password-modal-card photo-modal-card">
            <div className="password-modal-header">
              <h2 id="edit-photo-title" className="password-modal-title">
                Edit Photo
              </h2>
              <button
                type="button"
                className="password-modal-close"
                onClick={closePhotoEditor}
                aria-label="Close edit photo"
              >
                ×
              </button>
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="photo-hidden-input"
              onChange={handlePhotoInputChange}
            />

            {!photoDraftSrc ? (
              <>
                <div
                  className="photo-upload-dropzone"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handlePhotoDrop}
                >
                  <p className="photo-upload-title">
                    Drop your images here, or{" "}
                    <button
                      type="button"
                      className="photo-upload-browse"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      browse
                    </button>
                  </p>
                  <p className="photo-upload-subtitle">Supports JPG, JPEG2000, PNG</p>
                </div>

                <div className="password-modal-actions">
                  <button
                    type="button"
                    className="save-btn-inline password-modal-save"
                    onClick={savePhotoChanges}
                    disabled
                  >
                    Save Changes
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  className={`photo-editor-stage ${isDraggingPhoto ? "photo-editor-stage-dragging" : ""}`}
                  onMouseDown={beginPhotoDrag}
                >
                  {photoNaturalSize ? (
                    // eslint-disable-next-line next/no-img-element
                    <img
                      ref={photoPreviewRef}
                      src={photoDraftSrc}
                      alt="Profile photo preview"
                      className="photo-editor-image"
                      style={{
                        width: `${getPhotoBounds(photoNaturalSize.width, photoNaturalSize.height, photoZoom).width}px`,
                        height: `${getPhotoBounds(photoNaturalSize.width, photoNaturalSize.height, photoZoom).height}px`,
                        transform: `translate(${photoPosition.x}px, ${photoPosition.y}px)`,
                      }}
                      draggable={false}
                    />
                  ) : (
                    // eslint-disable-next-line next/no-img-element
                    <img
                      ref={photoPreviewRef}
                      src={photoDraftSrc}
                      alt="Profile photo preview"
                      className="photo-editor-image photo-editor-image-hidden"
                      onLoad={handlePhotoPreviewLoad}
                      draggable={false}
                    />
                  )}
                  <div className="photo-editor-overlay" aria-hidden="true" />
                </div>

                <div className="photo-editor-controls">
                  <div className="photo-editor-zoom">
                    <button
                      type="button"
                      className="photo-zoom-button"
                      onClick={() => updatePhotoZoom(photoZoom - 0.1)}
                      aria-label="Zoom out"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min={minPhotoZoom}
                      max={maxPhotoZoom}
                      step="0.01"
                      value={photoZoom}
                      className="photo-zoom-slider"
                      onChange={(event) => updatePhotoZoom(Number(event.target.value))}
                    />
                    <button
                      type="button"
                      className="photo-zoom-button"
                      onClick={() => updatePhotoZoom(photoZoom + 0.1)}
                      aria-label="Zoom in"
                    >
                      +
                    </button>
                    <span className="photo-zoom-value">{Math.round(photoZoom * 100)}%</span>
                  </div>

                  <button
                    type="button"
                    className="save-btn-inline password-modal-save"
                    onClick={savePhotoChanges}
                  >
                    Save Changes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isPhotoSuccessOpen && (
        <div
          className="password-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="photo-success-title"
        >
          <div className="password-modal-card password-success-card">
            <h2 id="photo-success-title" className="password-success-title">
              Profile Photo Changed
            </h2>
            <p className="password-success-text">
              You have successfully changed your profile photo.
            </p>
            <div className="password-success-icon" aria-hidden="true">
              ✓
            </div>
            <div className="password-success-actions">
              <button
                type="button"
                className="save-btn-inline password-success-button"
                onClick={() => setIsPhotoSuccessOpen(false)}
              >
                Back to profile
              </button>
            </div>
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

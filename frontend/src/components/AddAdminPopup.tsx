"use client";

import { useEffect, useId, useRef, useState } from "react";

import { createUser, updateUser, type UserAccount } from "@/api/users";
import { proximaFontStyle } from "@/styles/fontStyles";

type AddAdminPopupProps = {
  open: boolean;
  mode?: "create" | "edit";
  user?: UserAccount | null;
  onClose: () => void;
  onSuccess?: (user: UserAccount) => void;
};

function isValidEmail(value: string): boolean {
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || /\s/.test(local) || !domain || /\s/.test(domain)) return false;
  const lastDot = domain.lastIndexOf(".");
  return lastDot > 0 && lastDot < domain.length - 1;
}

export default function AddAdminPopup({
  open,
  mode = "create",
  user,
  onClose,
  onSuccess,
}: AddAdminPopupProps) {
  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const roleId = useId();
  const passwordId = useId();
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  const isEdit = mode === "edit";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setRole(user?.role ?? "");
    setPassword("");
    setEmailError(null);
    setSubmitError(null);
    setIsSubmitting(false);
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => firstInputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const handleOverlayMouseDown = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleSave = async () => {
    if (isSubmitting) return;

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const result =
        isEdit && user
          ? await updateUser(user.id, {
              email: trimmedEmail,
              firstName: firstName.trim() || null,
              lastName: lastName.trim() || null,
              phone: phone.trim() || null,
              role: role.trim() || null,
            })
          : await createUser({
              email: trimmedEmail,
              firstName: firstName.trim() || null,
              lastName: lastName.trim() || null,
              phone: phone.trim() || null,
              role: role.trim() || null,
              password: password.trim() || null,
            });

      if (!result.success) {
        setSubmitError(result.error || "Unable to save. Please try again.");
        return;
      }

      onSuccess?.(result.data);
      onClose();
    } catch {
      setSubmitError("Unable to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "h-[44px] w-full rounded-[12px] border border-[#b4b4b4] bg-white px-4 text-[14px] text-[#484848] placeholder:text-[#6c6c6c] outline-none focus:border-[#3b9a9a]";
  const title = isEdit ? "Edit Admin" : "Add Admin";
  const saveLabel = isEdit ? "Save Changes" : "Add Admin";
  const savingLabel = isEdit ? "Saving..." : "Adding...";

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4"
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-admin-title"
        className="w-full max-w-[480px] rounded-[30px] border border-[#d9d9d9] bg-white p-6 sm:p-8"
        style={proximaFontStyle}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="add-admin-title" className="text-[24px] font-semibold text-black">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#6c6c6c] transition-colors hover:bg-black/10 hover:text-black"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 6L6 18M18 18L6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[14px] text-[#484848]" htmlFor={firstNameId}>
                First Name
              </label>
              <input
                id={firstNameId}
                ref={firstInputRef}
                className={inputClass}
                placeholder="First name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[14px] text-[#484848]" htmlFor={lastNameId}>
                Last Name
              </label>
              <input
                id={lastNameId}
                className={inputClass}
                placeholder="Last name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[14px] text-[#484848]" htmlFor={emailId}>
              Email<span className="text-[#3b9a9a]">*</span>
            </label>
            <input
              id={emailId}
              type="email"
              className={`${inputClass} ${emailError ? "border-red-400" : ""}`}
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
            {emailError ? <p className="text-[13px] text-red-600">{emailError}</p> : null}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[14px] text-[#484848]" htmlFor={phoneId}>
                Phone Number
              </label>
              <input
                id={phoneId}
                className={inputClass}
                placeholder="Phone number"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[14px] text-[#484848]" htmlFor={roleId}>
                Role
              </label>
              <input
                id={roleId}
                className={inputClass}
                placeholder="e.g. CEO"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {isEdit ? null : (
            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#484848]" htmlFor={passwordId}>
                Password
              </label>
              <input
                id={passwordId}
                type="password"
                className={inputClass}
                placeholder="Leave blank to send an email invite"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-[13px] text-[#6c6c6c]">
                Leave blank to invite by email, or set a password (min 6 characters) to create the
                account directly.
              </p>
            </div>
          )}
        </div>

        {submitError ? <p className="mt-4 text-[14px] text-red-600">{submitError}</p> : null}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSubmitting}
            className="rounded-[40px] bg-[#3b9a9a] px-6 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[#327f7f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? savingLabel : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

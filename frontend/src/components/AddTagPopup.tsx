"use client";

import { useEffect, useId, useRef, useState } from "react";

import styles from "./AddTagPopup.module.css";

import { createTag, type TagRecord, type TagVisibility } from "@/api/tags";
import { DEFAULT_TAG_COLOR, PRESET_TAG_COLORS } from "@/constants/tagColors";

type AddTagPopupProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (tag: TagRecord) => void;
};

function normalizeCustomColor(value: string): string | null {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return null;
}

export default function AddTagPopup({ open, onClose, onSuccess }: AddTagPopupProps) {
  const nameId = useId();
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_TAG_COLOR);
  const [visibility, setVisibility] = useState<TagVisibility | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setColor(DEFAULT_TAG_COLOR);
    setVisibility(null);
    setNameError(null);
    setVisibilityError(null);
    setSubmitError(null);
    setIsSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleOverlayMouseDown = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  const validate = (): boolean => {
    let valid = true;
    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      setNameError("Tag name is required.");
      valid = false;
    } else {
      setNameError(null);
    }

    if (!visibility) {
      setVisibilityError("Select public or private visibility.");
      valid = false;
    } else {
      setVisibilityError(null);
    }

    return valid;
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    if (!validate()) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const tag = await createTag({
        name: name.trim(),
        color,
        visibility: visibility as TagVisibility,
      });
      onSuccess?.(tag);
      onClose();
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Unable to create tag. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextColor = normalizeCustomColor(event.target.value);
    if (nextColor) {
      setColor(nextColor);
    }
  };

  if (!open) return null;

  const presetColors = PRESET_TAG_COLORS as readonly string[];

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div
        className={styles.wrapper}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-tag-title"
      >
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <h2 id="add-tag-title" className={styles.title}>
              Add Tag
            </h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M18 6L6 18M18 18L6 6"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className={styles.field}>
          <label className={styles.caption} htmlFor={nameId}>
            Tag Name<span className={styles.asterisk}>*</span>
          </label>
          <input
            id={nameId}
            className={`${styles.input} ${nameError ? styles.inputError : ""}`}
            placeholder="Tag Name..."
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitting}
          />
          {nameError ? <p className={styles.fieldError}>{nameError}</p> : null}
        </div>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Tag Color</p>
          <div className={styles.colorRow}>
            {presetColors.map((presetColor, index) => {
              const isSelected = color === presetColor;
              return (
                <button
                  key={`${presetColor}-${index}`}
                  type="button"
                  className={`${styles.colorSwatch} ${isSelected ? styles.colorSwatchSelected : ""}`}
                  style={{ backgroundColor: presetColor, color: presetColor }}
                  aria-label={`Select color ${presetColor}`}
                  aria-pressed={isSelected}
                  onClick={() => setColor(presetColor)}
                  disabled={isSubmitting}
                />
              );
            })}
            <button
              type="button"
              className={styles.addColorButton}
              aria-label="Choose custom color"
              onClick={() => colorInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                <circle cx="15" cy="15" r="14" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M15 10V20M10 15H20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <input
              ref={colorInputRef}
              type="color"
              className={styles.hiddenColorInput}
              value={color}
              onChange={handleCustomColorChange}
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Visibility</p>
          <div className={styles.visibilityGroup} role="radiogroup" aria-label="Tag visibility">
            <label className={styles.visibilityOption}>
              <input
                type="radio"
                name="tag-visibility"
                className={styles.radio}
                checked={visibility === "public"}
                onChange={() => setVisibility("public")}
                disabled={isSubmitting}
              />
              Public
            </label>
            <label className={styles.visibilityOption}>
              <input
                type="radio"
                name="tag-visibility"
                className={styles.radio}
                checked={visibility === "private"}
                onChange={() => setVisibility("private")}
                disabled={isSubmitting}
              />
              Private
            </label>
          </div>
          {visibilityError ? <p className={styles.fieldError}>{visibilityError}</p> : null}
        </section>

        {submitError ? <p className={styles.submitError}>{submitError}</p> : null}

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={() => void handleSave()}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}

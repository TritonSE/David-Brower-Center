"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import styles from "./AddNpoPopup.module.css";

import type { TagOption } from "@/api/tags";

import { getTagOptions } from "@/api/tags";

const LOCATION_OPTIONS = ["Berkeley", "Los Angeles", "San Jose", "Other"] as const;
const NPO_SIZE_OPTIONS = ["Grassroots", "Small", "Medium", "Large"] as const;

export type FocusAreaValue = {
  id?: string;
  name: string;
  isCustom: boolean;
};

export type AddNpoValues = {
  title: string;
  description: string;
  mediaFiles: File[];
  location: string;
  npoSize: string;
  budgetSize: string;
  focusAreas: FocusAreaValue[];
};

type MediaPreview = {
  id: string;
  file: File;
  previewUrl: string;
};

type AddNpoPopupProps = {
  open: boolean;
  onClose: () => void;
  onNext?: (values: AddNpoValues) => void;
  onSaveDraft?: (values: AddNpoValues) => void;
  initialTitle?: string;
  initialDescription?: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

export default function AddNpoPopup({
  open,
  onClose,
  onNext,
  onSaveDraft,
  initialTitle = "",
  initialDescription = "",
  isSubmitting = false,
  errorMessage = null,
}: AddNpoPopupProps) {
  const titleId = useId();
  const descId = useId();
  const locationId = useId();
  const sizeId = useId();
  const budgetId = useId();
  const focusId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const focusComboboxRef = useRef<HTMLDivElement | null>(null);
  const mediaFilesRef = useRef<MediaPreview[]>([]);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [mediaFiles, setMediaFiles] = useState<MediaPreview[]>([]);
  const [location, setLocation] = useState("");
  const [npoSize, setNpoSize] = useState("");
  const [budgetSize, setBudgetSize] = useState("");
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [focusAreaQuery, setFocusAreaQuery] = useState("");
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<FocusAreaValue[]>([]);
  const [isFocusAreaOpen, setIsFocusAreaOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  // Reset values when popup is opened
  useEffect(() => {
    if (!open) return;
    setTitle(initialTitle);
    setDescription(initialDescription);
    setLocation("");
    setNpoSize("");
    setBudgetSize("");
    setFocusAreaQuery("");
    setSelectedFocusAreas([]);
    setIsFocusAreaOpen(false);
    setIsExitConfirmOpen(false);
    setMediaFiles((previous) => {
      previous.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [open, initialTitle, initialDescription]);

  useEffect(() => {
    if (!open) return;

    const abortController = new AbortController();
    setIsTagsLoading(true);
    setTagsError(null);

    getTagOptions(abortController.signal)
      .then((tags) => {
        setTagOptions(tags);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setTagOptions([]);
        setTagsError("Unable to load focus areas.");
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsTagsLoading(false);
        }
      });

    return () => abortController.abort();
  }, [open]);

  useEffect(() => {
    mediaFilesRef.current = mediaFiles;
  }, [mediaFiles]);

  // Revoke object URLs on unmount
  useEffect(
    () => () => {
      mediaFilesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    },
    [],
  );

  const values: AddNpoValues = {
    title,
    description,
    mediaFiles: mediaFiles.map((item) => item.file),
    location,
    npoSize,
    budgetSize,
    focusAreas: selectedFocusAreas,
  };

  const hasFilledFields = useMemo(
    () =>
      title !== initialTitle ||
      description !== initialDescription ||
      mediaFiles.length > 0 ||
      location.trim().length > 0 ||
      npoSize.trim().length > 0 ||
      budgetSize.trim().length > 0 ||
      focusAreaQuery.trim().length > 0 ||
      selectedFocusAreas.length > 0,
    [
      budgetSize,
      description,
      focusAreaQuery,
      initialDescription,
      initialTitle,
      location,
      mediaFiles.length,
      npoSize,
      selectedFocusAreas.length,
      title,
    ],
  );

  const handleRequestClose = useCallback(() => {
    if (hasFilledFields) {
      setIsExitConfirmOpen(true);
      setIsFocusAreaOpen(false);
      return;
    }

    onClose();
  }, [hasFilledFields, onClose]);

  const handleConfirmExit = () => {
    setIsExitConfirmOpen(false);
    onClose();
  };

  const handleContinueEditing = () => {
    setIsExitConfirmOpen(false);
  };

  // Escape key close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isExitConfirmOpen) {
        setIsExitConfirmOpen(false);
        return;
      }
      if (isFocusAreaOpen) {
        setIsFocusAreaOpen(false);
        return;
      }
      handleRequestClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRequestClose, isExitConfirmOpen, isFocusAreaOpen, open]);

  // Close focus area dropdown when clicking outside of it
  useEffect(() => {
    if (!isFocusAreaOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (focusComboboxRef.current?.contains(target)) return;
      setIsFocusAreaOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isFocusAreaOpen]);

  const selectedFocusNames = useMemo(
    () => new Set(selectedFocusAreas.map((tag) => tag.name.toLowerCase())),
    [selectedFocusAreas],
  );

  const matchingTagOptions = useMemo(() => {
    const query = focusAreaQuery.trim().toLowerCase();
    return tagOptions.filter((tag) => {
      if (selectedFocusNames.has(tag.name.toLowerCase())) return false;
      return query.length === 0 || tag.name.toLowerCase().includes(query);
    });
  }, [focusAreaQuery, selectedFocusNames, tagOptions]);

  const canAddCustomFocusArea =
    focusAreaQuery.trim().length > 0 &&
    !selectedFocusNames.has(focusAreaQuery.trim().toLowerCase());

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleRequestClose();
  };

  const handlePickFiles = () => fileInputRef.current?.click();

  const handleAddFocusArea = (tag: FocusAreaValue) => {
    setSelectedFocusAreas((previous) => [...previous, tag]);
    setFocusAreaQuery("");
    setIsFocusAreaOpen(false);
  };

  const handleRemoveFocusArea = (name: string) => {
    setSelectedFocusAreas((previous) => previous.filter((tag) => tag.name !== name));
  };

  const handleAddCustomFocusArea = () => {
    const name = focusAreaQuery.trim();
    if (!name || selectedFocusNames.has(name.toLowerCase())) return;
    handleAddFocusArea({ name, isCustom: true });
  };

  const handleBudgetSizeChange = (value: string) => {
    const sanitized = value.replace(/[^\d.]/g, "");
    const [rawDollars = "", ...rawCentsParts] = sanitized.split(".");
    const normalizedDollars = rawDollars.replace(/^0+(?=\d)/, "");
    const cents = rawCentsParts.join("").slice(0, 2);
    const hasDecimal = sanitized.includes(".");

    setBudgetSize(hasDecimal ? `${normalizedDollars || "0"}.${cents}` : normalizedDollars);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setMediaFiles((prev) => [...prev, ...next]);
  };

  const handleRemoveFile = (id: string) => {
    setMediaFiles((previous) => {
      const target = previous.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return previous.filter((item) => item.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (!open) return null;
  return (
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div
        ref={dialogRef}
        className={styles.wrapper}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-npo-title"
      >
        <header className={styles.addNpoTitle}>
          <div className={styles.headerRow}>
            <h2 id="add-npo-title" className={styles.title}>
              Add NPO
            </h2>

            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleRequestClose}
              aria-label="Close"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
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

        <div className={styles.contentLayout}>
          <div className={styles.field}>
            <label className={styles.caption} htmlFor={titleId}>
              Title<span className={styles.asterisk}>*</span>
            </label>
            <input
              id={titleId}
              className={`${styles.input} ${styles.inputSm}`}
              placeholder="NPO Name..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.caption} htmlFor={descId}>
              Description
            </label>
            <textarea
              id={descId}
              className={`${styles.input} ${styles.inputMd}`}
              placeholder="NPO Description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={`${styles.field} ${styles.mediaField}`}>
            <label className={styles.caption}>Media</label>

            {mediaFiles.length === 0 ? (
              <button
                type="button"
                className={styles.dropzone}
                onClick={handlePickFiles}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <span className={styles.dropzoneMain}>Drop your images here, or browse</span>
                <span className={styles.dropzoneSub}>Supports JPG, JPEG2000, PNG</span>
              </button>
            ) : (
              <div className={styles.mediaGrid} onDrop={handleDrop} onDragOver={handleDragOver}>
                {mediaFiles.map((item) => (
                  <div key={item.id} className={styles.mediaCard}>
                    {/* eslint-disable-next-line next/no-img-element -- local object URLs are user-selected previews, not remote app images. */}
                    <img src={item.previewUrl} alt={item.file.name} className={styles.mediaImage} />
                    <button
                      type="button"
                      className={styles.mediaDeleteButton}
                      aria-label={`Remove ${item.file.name}`}
                      onClick={() => handleRemoveFile(item.id)}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M4 7H20M10 11V17M14 11V17M5 7L6 19C6 19.5304 6.21071 20.0391 6.58579 20.4142C6.96086 20.7893 7.46957 21 8 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19L19 7M9 7V4C9 3.73478 9.10536 3.48043 9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className={styles.mediaAddTile}
                  onClick={handlePickFiles}
                  aria-label="Add image"
                >
                  <svg width="25" height="25" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M6 8H1C0.71667 8 0.479337 7.904 0.288004 7.712C0.0966702 7.52 0.000670115 7.28267 3.44827e-06 7C-0.000663218 6.71734 0.0953369 6.48 0.288004 6.288C0.48067 6.096 0.718003 6 1 6H6V1C6 0.71667 6.096 0.479337 6.288 0.288004C6.48 0.0966702 6.71734 0.000670115 7 3.44827e-06C7.28267 -0.000663218 7.52034 0.0953369 7.713 0.288004C7.90567 0.48067 8.00134 0.718003 8 1V6H13C13.2833 6 13.521 6.096 13.713 6.288C13.905 6.48 14.0007 6.71734 14 7C13.9993 7.28267 13.9033 7.52034 13.712 7.713C13.5207 7.90567 13.2833 8.00134 13 8H8V13C8 13.2833 7.904 13.521 7.712 13.713C7.52 13.905 7.28267 14.0007 7 14C6.71734 13.9993 6.48 13.9033 6.288 13.712C6.096 13.5207 6 13.2833 6 13V8Z"
                      fill="#909090"
                    />
                  </svg>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jp2"
              multiple
              className={styles.hiddenFileInput}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.currentTarget.value = "";
              }}
            />
          </div>

          <div className={styles.demographicsGrid}>
            <div className={styles.field}>
              <label className={styles.caption} htmlFor={locationId}>
                Location
              </label>
              <select
                id={locationId}
                className={`${styles.input} ${styles.inputSm} ${styles.select}`}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Select Location</option>
                {LOCATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.caption} htmlFor={sizeId}>
                NPO Size
              </label>
              <select
                id={sizeId}
                className={`${styles.input} ${styles.inputSm} ${styles.select}`}
                value={npoSize}
                onChange={(e) => setNpoSize(e.target.value)}
              >
                <option value="">Select NPO Size</option>
                {NPO_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.caption} htmlFor={budgetId}>
                Budget Size
              </label>
              <div className={styles.currencyInputWrap}>
                <span className={styles.currencyPrefix}>$</span>
                <input
                  id={budgetId}
                  className={`${styles.input} ${styles.inputSm} ${styles.currencyInput}`}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0.00"
                  value={budgetSize}
                  onChange={(e) => handleBudgetSizeChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.caption} htmlFor={focusId}>
              Focus Area
            </label>
            <div className={styles.focusCombobox} ref={focusComboboxRef}>
              <div className={styles.focusInputWrap}>
                <div className={styles.focusPills}>
                  {selectedFocusAreas.map((tag) => (
                    <span key={tag.name} className={styles.focusPill}>
                      {tag.name}
                      <button
                        type="button"
                        className={styles.focusPillRemove}
                        aria-label={`Remove ${tag.name}`}
                        onClick={() => handleRemoveFocusArea(tag.name)}
                      >
                        x
                      </button>
                    </span>
                  ))}
                  <input
                    id={focusId}
                    className={styles.focusInput}
                    placeholder={
                      selectedFocusAreas.length > 0
                        ? "Add another focus area"
                        : "Search Focus Area (ex: Water Conservation)"
                    }
                    value={focusAreaQuery}
                    onChange={(e) => {
                      setFocusAreaQuery(e.target.value);
                      setIsFocusAreaOpen(true);
                    }}
                    onFocus={() => setIsFocusAreaOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomFocusArea();
                      }
                      if (e.key === "Escape") {
                        setIsFocusAreaOpen(false);
                      }
                    }}
                  />
                </div>
              </div>

              {isFocusAreaOpen ? (
                <div className={styles.focusDropdown}>
                  {isTagsLoading ? (
                    <p className={styles.focusStatus}>Loading focus areas...</p>
                  ) : tagsError ? (
                    <p className={styles.focusStatus}>{tagsError}</p>
                  ) : (
                    <>
                      {matchingTagOptions.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          className={styles.focusOption}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleAddFocusArea({ id: tag.id, name: tag.name, isCustom: false });
                          }}
                        >
                          {tag.name}
                        </button>
                      ))}

                      {canAddCustomFocusArea ? (
                        <button
                          type="button"
                          className={styles.focusOption}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleAddCustomFocusArea();
                          }}
                        >
                          Add "{focusAreaQuery.trim()}"
                        </button>
                      ) : null}

                      {matchingTagOptions.length === 0 && !canAddCustomFocusArea ? (
                        <p className={styles.focusStatus}>No focus areas found.</p>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.saveDraft}
              disabled={isSubmitting}
              onClick={() => onSaveDraft?.(values)}
            >
              Save Draft
            </button>

            <button
              type="button"
              className={styles.nextButton}
              disabled={isSubmitting}
              onClick={() => onNext?.(values)}
            >
              {isSubmitting ? "Saving..." : "Next"}
            </button>
          </div>
        </footer>

        {isExitConfirmOpen ? (
          <div className={styles.exitConfirmLayer} role="presentation">
            <section
              className={styles.exitConfirmDialog}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="exit-confirm-title"
              aria-describedby="exit-confirm-description"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className={styles.exitConfirmCopy}>
                <h3 id="exit-confirm-title" className={styles.exitConfirmTitle}>
                  Exit?
                </h3>
                <p id="exit-confirm-description" className={styles.exitConfirmDescription}>
                  If you leave without saving, all your changes will be lost.
                </p>
              </div>

              <div className={styles.exitConfirmButtons}>
                <button type="button" className={styles.exitButton} onClick={handleConfirmExit}>
                  Exit
                </button>
                <button
                  type="button"
                  className={styles.continueEditingButton}
                  onClick={handleContinueEditing}
                >
                  Continue editing
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

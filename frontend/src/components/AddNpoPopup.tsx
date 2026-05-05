"use client";

import { useEffect, useId, useRef, useState } from "react";

import styles from "./AddNpoPopup.module.css";

type AddNpoValues = {
  title: string;
  description: string;
  mediaFiles: File[];
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
};

export default function AddNpoPopup({
  open,
  onClose,
  onNext,
  onSaveDraft,
  initialTitle = "",
  initialDescription = "",
}: AddNpoPopupProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaFilesRef = useRef<MediaPreview[]>([]);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [mediaFiles, setMediaFiles] = useState<MediaPreview[]>([]);

  // Reset values when popup is opened
  useEffect(() => {
    if (!open) return;
    setTitle(initialTitle);
    setDescription(initialDescription);
    setMediaFiles((previous) => {
      previous.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [open, initialTitle, initialDescription]);

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

  // Escape key close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const values: AddNpoValues = {
    title,
    description,
    mediaFiles: mediaFiles.map((item) => item.file),
  };

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handlePickFiles = () => fileInputRef.current?.click();

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
              onClick={onClose}
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

          <div className={styles.field}>
            <label className={styles.caption}>Media</label>

            <div className={styles.mediaGrid} onDrop={handleDrop} onDragOver={handleDragOver}>
              {mediaFiles.map((item) => (
                <div key={item.id} className={styles.mediaCard}>
                  <img src={item.previewUrl} alt={item.file.name} className={styles.mediaImage} />
                  <button
                    type="button"
                    className={styles.mediaDeleteButton}
                    aria-label={`Remove ${item.file.name}`}
                    onClick={() => handleRemoveFile(item.id)}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
          </div>
        </div>

        <footer className={styles.footer}>
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.saveDraft}
              onClick={() => onSaveDraft?.(values)}
            >
              Save Draft
            </button>

            <button type="button" className={styles.nextButton} onClick={() => onNext?.(values)}>
              Next
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

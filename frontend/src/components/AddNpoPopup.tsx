"use client";

import { useEffect, useId, useRef, useState } from "react";

import styles from "./AddNpoPopup.module.css";

type AddNpoValues = {
  title: string;
  description: string;
  mediaFiles: File[];
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
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  // Reset values when popup is opened
  useEffect(() => {
    if (!open) return;
    setTitle(initialTitle);
    setDescription(initialDescription);
    setMediaFiles([]);
  }, [open, initialTitle, initialDescription]);

  // Escape key close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const values: AddNpoValues = { title, description, mediaFiles };

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handlePickFiles = () => fileInputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files);
    setMediaFiles((prev) => [...prev, ...next]);
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

            <div className={styles.dropzone} onDrop={handleDrop} onDragOver={handleDragOver}>
              <div className={styles.dropzoneText}>
                <div className={styles.dropzoneMain}>
                  Drop your images here, or{" "}
                  <button type="button" className={styles.browseButton} onClick={handlePickFiles}>
                    browse
                  </button>
                </div>
                <div className={styles.dropzoneSub}>Supports JPG, JPEG2000, PNG</div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jp2"
                multiple
                className={styles.hiddenFileInput}
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {mediaFiles.length > 0 && (
              <div className={styles.fileList}>
                {mediaFiles.map((f, idx) => (
                  <div key={`${f.name}-${idx}`} className={styles.filePill}>
                    {f.name}
                  </div>
                ))}
              </div>
            )}
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

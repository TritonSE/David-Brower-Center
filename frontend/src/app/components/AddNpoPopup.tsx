"use client";

import { useEffect, useId, useRef, useState } from "react";

import styles from "./AddNpoPopup.module.css";

type AddNpoValues = {
    title: string,
    description: string,
    mediaFiles: File[]
}

type AddNpoPopupProps = {
    open: boolean,
    onClose: () => void,
    onNext?: (values: AddNpoValues) => void;
    onSaveDraft?: (values: AddNpoValues) => void;
    initialTitle?: string;
    initialDescription?: string;
}

export default function AddNpoPopup({
    open,
    onClose,
    onNext,
    onSaveDraft,
    initialTitle = "",
    initialDescription = ""
}: AddNpoPopupProps){
    const titleId = useId();
    const descId = useId();
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [savedDraft, setSavedDraft] = useState(false);

    // Reset values when popup is opened
    useEffect(() => {
        if(!open) return;
        setTitle(initialTitle);
        setDescription(initialDescription);
        setMediaFiles([]);
    }, [open, initialTitle, initialDescription]);

    // Escape key close
    useEffect(() => {
        if(!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if(e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    const values: AddNpoValues = { title, description, mediaFiles };

    const handleOverlayMouseDown = (e: React.MouseEvent) => {
        if(e.target === e.currentTarget) onClose();
    };

    const handlePickFiles = () => fileInputRef.current?.click();

    const handleFiles = (files: FileList) => {
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M18 18L6 6" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

              <div
                className={styles.dropzone}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className={styles.dropzoneText}>
                  <div className={styles.dropzoneMain}>
                    Drop your images here, or{" "}
                    <button
                      type="button"
                      className={styles.browseButton}
                      onClick={handlePickFiles}
                    >
                      browse
                    </button>
                  </div>
                  <div className={styles.dropzoneSub}>
                    Supports JPG, JPEG2000, PNG
                  </div>
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
                onClick={() => { onSaveDraft?.(values);
                setSavedDraft(true); }}
              >
                Save Draft
              </button>

              {savedDraft && (
                <div className={styles.toast}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.49992 14.1673C8.37556 14.1684 9.24278 13.9965 10.0518 13.6614C10.8607 13.3263 11.5955 12.8346 12.2139 12.2147C12.8339 11.5963 13.3255 10.8615 13.6606 10.0525C13.9957 9.24351 14.1677 8.37629 14.1666 7.50066C14.1677 6.62502 13.9957 5.7578 13.6606 4.94882C13.3255 4.13984 12.8339 3.40505 12.2139 2.78666C11.5955 2.16671 10.8607 1.67506 10.0518 1.33996C9.24278 1.00486 8.37556 0.83291 7.49992 0.833989C6.62429 0.83291 5.75707 1.00486 4.94809 1.33996C4.13911 1.67506 3.40431 2.16671 2.78592 2.78666C2.16598 3.40505 1.67433 4.13984 1.33923 4.94882C1.00413 5.7578 0.832177 6.62502 0.833257 7.50066C0.832177 8.37629 1.00413 9.24351 1.33923 10.0525C1.67433 10.8615 2.16598 11.5963 2.78592 12.2147C3.40431 12.8346 4.13911 13.3263 4.94809 13.6614C5.75707 13.9965 6.62429 14.1684 7.49992 14.1673Z" fill="#1A8538" stroke="#1A8538" strokeWidth="1.66667" strokeLinejoin="round"/>
                    <path d="M4.8335 7.5L6.8335 9.5L10.8335 5.5" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Changes have been saved.

                  <button className={styles.toastClose} onClick={() => setSavedDraft(false)} aria-label="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M18 18L6 6" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
              <button
                type="button"
                className={styles.nextButton}
                onClick={() => onNext?.(values)}
              >
                Next
              </button>
            </div>
          </footer>
        </div>
      </div>
    );
}
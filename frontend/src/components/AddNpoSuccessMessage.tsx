"use client";

import styles from "./AddNpoPopup.module.css";

type AddNpoSuccessMessageProps = {
  message: string;
  onDismiss: () => void;
};

function SuccessCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="#2D7D32" />
      <path
        d="M5.25 9.25l2.25 2.25 5.25-5.25"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AddNpoSuccessMessage({ message, onDismiss }: AddNpoSuccessMessageProps) {
  return (
    <div className={styles.toast} role="status">
      <span className={styles.toastIcon}>
        <SuccessCheckIcon />
      </span>
      <p className={styles.toastMessage}>{message}</p>
      <button
        type="button"
        className={styles.toastDismiss}
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

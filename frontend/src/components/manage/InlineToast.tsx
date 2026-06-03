"use client";

import { useEffect } from "react";

import { proximaFontStyle } from "@/styles/fontStyles";

export type InlineToastAction = {
  label: string;
  onClick: () => void;
};

type InlineToastProps = {
  action?: InlineToastAction;
  message: string;
  onClose: () => void;
};

export default function InlineToast({ action, message, onClose }: InlineToastProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timeoutId);
  }, [onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[72px] left-1/2 z-[10010] flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-[14px] rounded-[5px] border border-[#3b9a9a] bg-[#cdebeb] px-4 py-4 shadow-[0_10px_25px_rgba(0,0,0,0.12)]"
    >
      <p
        className="font-proxima shrink-0 text-[12px] leading-none text-black"
        style={proximaFontStyle}
      >
        {message}
      </p>

      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="shrink-0 font-rubik text-[12px] font-bold tracking-[0.02em] text-[#2c7d7d] underline underline-offset-2"
        >
          {action.label}
        </button>
      ) : null}

      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onClose}
        className="inline-flex h-3 w-3 shrink-0 items-center justify-center text-black transition-opacity hover:opacity-70"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M10.5 1.5 1.5 10.5M10.5 10.5 1.5 1.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

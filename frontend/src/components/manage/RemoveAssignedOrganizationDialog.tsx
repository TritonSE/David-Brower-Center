"use client";

import { useEffect, useRef } from "react";

import { proximaFontStyle, rubikFontStyle } from "@/styles/fontStyles";

type RemoveAssignedOrganizationDialogProps = {
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
};

export default function RemoveAssignedOrganizationDialog({
  onClose,
  onConfirm,
  open,
}: RemoveAssignedOrganizationDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    cancelButtonRef.current?.focus();

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] grid place-items-center bg-black/15 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-npo-title"
        className="w-full max-w-[520px] rounded-[16px] border border-black/10 bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
        style={proximaFontStyle}
      >
        <h2 id="remove-npo-title" className="font-proxima text-[24px] font-semibold text-black">
          Remove NPO
        </h2>

        <p className="font-rubik mt-4 text-[14px] leading-6 text-[#484848]" style={rubikFontStyle}>
          Are you sure you want to remove this NPO from this tag?
        </p>

        <div className="mt-8 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            className="font-proxima rounded-[40px] border border-[#d9d9d9] bg-white px-5 py-[10px] text-[15px] font-semibold text-[#484848] transition-colors hover:border-[#b4b4b4]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="font-proxima rounded-[40px] bg-[#3b9a9a] px-5 py-[10px] text-[15px] font-semibold text-white transition-colors hover:brightness-95"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

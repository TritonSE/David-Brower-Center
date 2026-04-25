"use client";

type ExitConfirmationProps = {
  open: boolean;
  onExit: () => void; // user confirms leaving
  onContinue: () => void;
};

export function NpoExitPopup({ open, onExit, onContinue }: ExitConfirmationProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-4">
      {/* background overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* popup card */}
      <div className="relative w-full max-w-[520px] rounded-[20px] bg-white px-8 py-7 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
        <h2 className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[32px] font-bold text-black">
          Exit?
        </h2>

        <p className="mt-3 text-[16px] text-[#484848]">
          If you leave without saving, all your changes will be lost.
        </p>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={onExit}
            className="rounded-[40px] border border-[#d9d9d9] bg-white px-7 py-2 text-[20px] font-normal text-[#3b9a9a]"
          >
            Exit
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="rounded-[40px] bg-[#3b9a9a] px-7 py-2 text-[16px] text-white"
          >
            Continue editing
          </button>
        </div>
      </div>
    </div>
  );
}
export default NpoExitPopup;

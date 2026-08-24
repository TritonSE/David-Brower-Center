"use client";

import CheckboxGroup from "./Checkbox";
import SelectionBox from "./SelectionBox";

type FocusAreaState = "ready" | "loading" | "empty" | "error";

type FilteringMenuProps = {
  focusAreaOptions: string[];
  focusAreaState: FocusAreaState;
  focusAreaErrorMessage?: string | null;
  selectedFocusAreas: string[];
  onFocusAreaChange: (selected: string[]) => void;
  sizeOptions: string[];
  selectedSizes: string[];
  onSizeChange: (selected: string[]) => void;
};

export default function FilteringMenu({
  focusAreaOptions,
  focusAreaState,
  focusAreaErrorMessage,
  selectedFocusAreas,
  onFocusAreaChange,
  sizeOptions,
  selectedSizes,
  onSizeChange,
}: FilteringMenuProps) {
  const focusAreaStatusMessage =
    focusAreaState === "loading"
      ? "Loading focus areas..."
      : focusAreaState === "error"
        ? (focusAreaErrorMessage ?? "Unable to load focus areas.")
        : focusAreaState === "empty"
          ? "No focus areas available."
          : null;

  return (
    <div
      className="bg-white border-[#B4B4B4] rounded-2xl border flex flex-col overflow-hidden"
      style={{ width: "409px" }}
    >
      <div className="p-6 overflow-y-auto">
        {focusAreaState === "ready" ? (
          <SelectionBox
            title="Focus Area"
            options={focusAreaOptions}
            selectedOptions={selectedFocusAreas}
            onSelectionChange={onFocusAreaChange}
          />
        ) : (
          <div className="mb-6 border-black pt-4">
            <h3 className="font-sans text-xl font-semibold text-gray-900">Focus Area</h3>
            <p className="mt-2 text-sm text-[#484848]">{focusAreaStatusMessage}</p>
          </div>
        )}

        {sizeOptions.length > 0 && (
          <CheckboxGroup
            title="Size"
            options={sizeOptions}
            selectedOptions={selectedSizes}
            onChange={onSizeChange}
          />
        )}
      </div>
    </div>
  );
}

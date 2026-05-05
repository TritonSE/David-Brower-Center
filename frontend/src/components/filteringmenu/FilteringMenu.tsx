"use client";

import CheckboxGroup from "./Checkbox";
import SelectionBox from "./SelectionBox";
import SliderFilter from "./SliderFilter";

type FocusAreaState = "ready" | "loading" | "empty" | "error";

type FilteringMenuProps = {
  focusAreaOptions: string[];
  focusAreaState: FocusAreaState;
  focusAreaErrorMessage?: string | null;
};

export default function FilteringMenu({
  focusAreaOptions,
  focusAreaState,
  focusAreaErrorMessage,
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
      style={{
        width: "409px",
        height: "486px",
      }}
    >
      {/* Scrollable Content Area */}
      <div className="p-6 overflow-y-auto h-full">
        {focusAreaState === "ready" ? (
          <SelectionBox title="Focus Area" options={focusAreaOptions} />
        ) : (
          <div className="mb-6 border-black pt-4">
            <h3 className="font-sans text-xl font-semibold text-gray-900">Focus Area</h3>
            <p className="mt-2 text-sm text-[#484848]">{focusAreaStatusMessage}</p>
          </div>
        )}

        <CheckboxGroup
          title="Distance from me"
          options={["2 miles", "10 miles", "50 miles", "100 miles"]}
        />

        <SliderFilter title="Size" />

        <CheckboxGroup
          title="Opportunity Type"
          options={["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"]}
        />

        <SliderFilter title="Budget" />
      </div>
    </div>
  );
}

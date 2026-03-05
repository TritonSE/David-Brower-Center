import CheckboxGroup from "./Checkbox";
import SelectionBox from "./SelectionBox";
import SliderFilter from "./SliderFilter";

export default function FilteringMenu() {
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
        <SelectionBox
          title="Focus Area"
          options={[
            "Environmental",
            "Food",
            "Agriculture",
            "Government",
            "Social",
            "Education",
            "Technology",
          ]}
        />

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

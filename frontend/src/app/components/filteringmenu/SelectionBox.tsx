import { DM_Sans, Rubik } from "next/font/google";
import { useState } from "react";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const rubik = Rubik({ subsets: ["latin"], variable: "--font-rubik" });

type SelectionBoxProps = {
  title: string;
  options: string[];
};

export default function SelectionBox({ title, options }: SelectionBoxProps) {
  // 1. Change state to an array to allow multiple selections
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const toggleOption = (option: string) => {
    setSelectedOptions(
      (prev) =>
        prev.includes(option)
          ? prev.filter((item) => item !== option) // Remove if clicked again
          : [...prev, option], // Add if not already selected
    );
  };

  return (
    <div
      className="mb-6 first:border-t-0 border-black pt-4"
      style={
        {
          "--font-rubik": rubik.style.fontFamily,
          "--font-dm-sans": dmSans.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <div className="flex justify-between items-center mb-3">
        <h3
          className="font-sans font-semibold text-gray-900 text-xl"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {title}
        </h3>
        <button
          onClick={() => setSelectedOptions([])} // 2. Clear all selections at once
          className="cursor-pointer flex items-center justify-center font-bold text-[#3B9A9A]"
          style={{ fontFamily: "var(--font-rubik)" }}
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          // 3. Check if this specific option is in the selected array
          const isSelected = selectedOptions.includes(option);

          return (
            <button
              key={option}
              onClick={() => toggleOption(option)}
              style={{ fontFamily: "var(--font-rubik)" }}
              className={`
                px-4 h-[40px] text-[13px] relative cursor-pointer border rounded-full text-sm transition-colors
                ${
                  isSelected
                    ? "bg-[#3B9A9A] text-white border-[#D9D9D9]"
                    : "bg-white text-[#3B9A9A] border-[#B4B4B4] hover:bg-gray-50"
                }
              `}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

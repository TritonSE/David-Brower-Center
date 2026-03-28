"use client";

import { DM_Sans, Rubik } from "next/font/google";
import { useState } from "react";

type CheckboxGroupProps = {
  title: string;
  options: string[];
};

const rubik = Rubik({ subsets: ["latin"], variable: "--font-rubik" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export default function CheckboxGroup({ title, options }: CheckboxGroupProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const toggleOption = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option],
    );
  };

  return (
    <div
      className="mb-6 border-t border-[#D9D9D9] pt-4"
      style={
        {
          "--font-rubik": rubik.style.fontFamily,
          "--font-dm-sans": dmSans.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <div className="flex justify-between items-center mb-3">
        <h3
          className="font-semibold text-gray-900 text-xl leading-none"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {title}
        </h3>
        <button
          onClick={() => setSelectedOptions([])}
          className="w-[40px] h-[24px] font-rubik font-bold text-[16px] text-[#3B9A9A] cursor-pointer"
          style={{ fontFamily: "var(--font-rubik)" }}
        >
          Clear
        </button>
      </div>

      <div className="space-y-2">
        {options.map((option) => {
          const isChecked = selectedOptions.includes(option);

          return (
            <label key={option} className="flex items-center space-x-3 cursor-pointer group">
              {/* Relative container to hold the hidden input and the visible icon */}
              <div className="relative flex items-center justify-center w-[18px] h-[18px] gap-[6px]">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleOption(option)}
                  className={`
                    appearance-none 
                    w-full h-full 
                    border-[1.5px] rounded-[4px] 
                    cursor-pointer transition-all duration-150
                    ${
                      isChecked
                        ? "bg-[#3B9A9A] border-[#3B9A9A]"
                        : "bg-white border-[#909090] hover:border-[#3B9A9A]"
                    }
                  `}
                />

                {/* The Checkmark Icon */}
                {isChecked && (
                  <svg
                    className="absolute w-4 h-4 text-white pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>

              <span
                className="font-rubik font-normal text-[16px] leading-[24px] text-black"
                style={{ fontFamily: "var(--font-rubik)" }}
              >
                {option}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

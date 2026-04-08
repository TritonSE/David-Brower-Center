"use client";

import { Rubik } from "next/font/google";
import React from "react";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

const sortOptions = [
  "NPO Name A-Z",
  "NPO Name Z-A",
  "Year Ascending",
  "Year Descending",
  "Focus A-Z",
  "Focus Z-A",
];

type SortMenuProps = {
  selected: string;
  onSelect: (option: string) => void;
};

export default function SortMenuPopup({ selected, onSelect }: SortMenuProps) {
  return (
    <div
      className={`bg-white border border-gray-300 shadow-md p-6 flex flex-col box-border ${rubik.variable}`}
      style={{
        width: "267px",
        height: "337px",
        borderRadius: "28px",
        fontFamily: "var(--font-rubik)",
      }}
    >
      <h2 className="text-black text-lg mb-4">Sort By:</h2>

      <div className="flex flex-col h-full justify-between pb-1">
        {sortOptions.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={`flex items-center justify-between w-full text-left text-[15px] transition-colors duration-150 ${
              selected === option ? "text-[#3B9A9A]" : "text-gray-800 hover:text-[#3B9A9A]"
            }`}
          >
            <span>{option}</span>

            {selected === option && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

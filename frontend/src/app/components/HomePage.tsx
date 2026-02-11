"use client";

import { useEffect, useMemo, useState } from "react";

import NpoListView from "./NpoListView";
import NpoProfileCard from "./NpoProfileCard";

import type { Row } from "./NpoListView";

const tagIconEnvironmental =
  "https://www.figma.com/api/mcp/asset/ca9189f4-b7cc-4829-aba5-ca0a5f187c63";
const tagIconPeople = "https://www.figma.com/api/mcp/asset/12dc4428-fdae-413c-b197-aa5c28ed3003";
const tagIconMoney = "https://www.figma.com/api/mcp/asset/617eab0e-129e-4a76-9b50-9075ae8e634b";
const tagIconLocation = "https://www.figma.com/api/mcp/asset/fd5607d5-7878-4e73-9008-8e6223c9c745";

const rows: Row[] = [
  {
    id: "org-1",
    name: "Organization Name",
    focus: "Environmental",
    size: "Mid Sized",
    budget: "100k",
    location: "Berkeley, CA",
    year: "2026",
  },
  {
    id: "org-2",
    name: "Organization Name",
    focus: "Environmental",
    size: "Size",
    budget: "XXX",
    location: "Location",
    year: "2026",
  },
  {
    id: "org-3",
    name: "Organization Name",
    focus: "Environmental",
    size: "Size",
    budget: "XXX",
    location: "Location",
    year: "2026",
  },
  {
    id: "org-4",
    name: "Organization Name",
    focus: "Environmental",
    size: "Size",
    budget: "XXX",
    location: "Location",
    year: "2026",
  },
  {
    id: "org-5",
    name: "Organization Name",
    focus: "Environmental",
    size: "Size",
    budget: "XXX",
    location: "Location",
    year: "2026",
  },
  {
    id: "org-6",
    name: "Organization Name",
    focus: "Environmental",
    size: "Size",
    budget: "XXX",
    location: "Location",
    year: "2026",
  },
  {
    id: "org-7",
    name: "Organization Name",
    focus: "Environmental",
    size: "Size",
    budget: "XXX",
    location: "Location",
    year: "2026",
  },
  {
    id: "org-8",
    name: "Organization Name",
    focus: "Environmental",
    size: "Size",
    budget: "XXX",
    location: "Location",
    year: "2026",
  },
  {
    id: "org-9",
    name: "Organization Name",
    focus: "Environmental",
    size: "Size",
    budget: "XXX",
    location: "Location",
    year: "2026",
  },
  {
    id: "org-10",
    name: "Organization Name",
    focus: "Environmental",
    size: "Size",
    budget: "XXX",
    location: "Location",
    year: "2026",
  },
];

export default function HomePage() {
  const [activeRow, setActiveRow] = useState<Row | null>(null);
  const [isCardVisible, setIsCardVisible] = useState(false);

  // Clear the card content after fade-out to avoid abrupt disappear.
  useEffect(() => {
    if (!isCardVisible && activeRow) {
      const timer = setTimeout(() => setActiveRow(null), 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isCardVisible, activeRow]);

  const selectedCardProps = useMemo(() => {
    if (!activeRow) return null;

    return {
      name: activeRow.name,
      tags: [
        { iconSrc: tagIconEnvironmental, label: activeRow.focus },
        { iconSrc: tagIconPeople, label: activeRow.size },
        { iconSrc: tagIconMoney, label: activeRow.budget },
        { iconSrc: tagIconLocation, label: activeRow.location },
      ],
    } as const;
  }, [activeRow]);

  return (
    <div className="min-h-screen bg-[#f2f9f8] px-4 py-6 md:px-8 lg:px-10">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-[30px] border border-[#d9d9d9] bg-white p-2 shadow-sm">
            <button
              className="rounded-[40px] bg-[#3b9a9a] px-6 py-2 text-sm font-semibold text-white"
              type="button"
            >
              Graph
            </button>
            <button
              className="rounded-[40px] px-6 py-2 text-sm font-semibold text-[#6c6c6c] hover:text-[#3b9a9a]"
              type="button"
            >
              List
            </button>
          </div>
        </div>
        <button
          className="rounded-[40px] border border-[#b4b4b4] bg-white px-6 py-2 text-sm font-semibold text-[#3b9a9a] shadow-sm"
          type="button"
        >
          Sign In
        </button>
      </header>

      <div className="grid gap-6">
        <NpoListView
          rows={rows}
          selectedId={activeRow?.id ?? null}
          onSelect={(row) => {
            if (activeRow?.id === row.id && isCardVisible) {
              setIsCardVisible(false);
              return;
            }
            setActiveRow(row);
            setIsCardVisible(true);
          }}
        />
      </div>

      {/* Overlay card that fades in/out and sits above the page */}
      <div
        className={`pointer-events-none fixed inset-0 z-20 flex items-center justify-end px-4 py-8 md:px-8 lg:px-10 transition-opacity duration-200 ${
          isCardVisible && selectedCardProps ? "opacity-100" : "opacity-0"
        }`}
      >
        {selectedCardProps ? (
          <div
            className="pointer-events-auto max-w-160 rounded-[30px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.1)] transition-transform duration-200"
            style={{ transform: isCardVisible ? "translateY(0)" : "translateY(8px)" }}
          >
            <NpoProfileCard {...selectedCardProps} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

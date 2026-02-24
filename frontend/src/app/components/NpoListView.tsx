import React from "react";

export type Row = {
  id: string;
  name: string;
  focus: string;
  size: string;
  budget: string;
  location: string;
  year: string;
};

type NpoListViewProps = {
  rows: Row[];
  selectedId?: string | null;
  onSelect?: (row: Row) => void;
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-[#6c6c6c]" aria-hidden>
      <path
        d="M10.5 3a7.5 7.5 0 1 0 4.66 13.38l4.23 4.23a1 1 0 1 0 1.41-1.41l-4.23-4.23A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#6c6c6c]" aria-hidden>
      <path
        d="M3 5a1 1 0 0 1 1-1h16a1 1 0 0 1 .8 1.6L14 14.5V20a1 1 0 0 1-1.45.9l-2-1A1 1 0 0 1 10 19v-4.5L3.2 5.6A1 1 0 0 1 3 5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SortArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3 w-3 text-black" aria-hidden>
      <path d="M10 14 5 8h10l-5 6Z" fill="currentColor" />
    </svg>
  );
}

export function NpoListView({ rows, selectedId, onSelect }: NpoListViewProps) {
  return (
    <div className="rounded-[30px] border border-[#d9d9d9] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex w-full max-w-[400px] items-center rounded-[100px] border border-[#b4b4b4] bg-white px-5 py-[10px]">
          <div className="pointer-events-none absolute left-5">
            <SearchIcon />
          </div>
          <input
            className="w-full pl-8 text-sm text-[#6c6c6c] placeholder:text-[#6c6c6c] focus:outline-none"
            placeholder="Search"
            type="search"
          />
        </div>
        <button
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#b4b4b4] bg-white"
          type="button"
          aria-label="Open filters"
        >
          <FilterIcon />
        </button>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-[#d9d9d9]">
        <div className="grid grid-cols-[1.5fr_1.2fr_0.6fr] items-center border-b border-[#d9d9d9] bg-white px-4 py-3 text-sm font-semibold text-black">
          <div className="flex items-center gap-2">
            <SortArrowIcon />
            <span>Name</span>
          </div>
          <span>Focus</span>
          <span>Year</span>
        </div>

        <div className="divide-y divide-[#d9d9d9]">
          {rows.map((row, index) => {
            const isActive = selectedId === row.id;
            const isEven = index % 2 === 1;

            return (
              <button
                key={row.id}
                type="button"
                onClick={() => onSelect?.(row)}
                className={`grid w-full cursor-pointer grid-cols-[1.5fr_1.2fr_0.6fr] items-center px-4 py-3 text-left text-sm transition-colors ${
                  isActive
                    ? "bg-linear-to-r from-[#3b9a9a] via-[#3b9a9a]/70 to-white text-white"
                    : isEven
                      ? "bg-[#f2f9f8]"
                      : "bg-white hover:bg-[#f7fbfa]"
                }`}
              >
                <span className={isActive ? "font-semibold" : "text-[#1f1f1f]"}>{row.name}</span>
                <span className={isActive ? "font-semibold" : "text-[#1f1f1f]"}>{row.focus}</span>
                <span className={isActive ? "font-semibold" : "text-[#1f1f1f]"}>{row.year}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default NpoListView;

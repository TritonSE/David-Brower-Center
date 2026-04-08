import React, { useMemo, useState } from "react";

import FilteringMenu from "./filteringmenu/FilteringMenu";
import { FilterIcon, SearchIcon, SortArrowIcon } from "./icons/AppIcons";
import SortMenuPopup from "./SortMenuPopup";

export type Row = {
  id: string;
  name: string;
  focus: string;
  year: string;
};

type NpoListViewProps = {
  rows: Row[];
  selectedId?: string | null;
  onSelect?: (row: Row) => void;
};

export function NpoListView({ rows, selectedId, onSelect }: NpoListViewProps) {
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("NPO Name A-Z");

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = rows;

    if (query.length > 0) {
      result = result.filter((row) => row.name.toLowerCase().includes(query));
    }

    const sorted = [...result];

    switch (sortOption) {
      case "NPO Name A-Z":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "NPO Name Z-A":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "Year Ascending":
        sorted.sort((a, b) => Number(a.year) - Number(b.year));
        break;
      case "Year Descending":
        sorted.sort((a, b) => Number(b.year) - Number(a.year));
        break;
      case "Focus A-Z":
        sorted.sort((a, b) => a.focus.localeCompare(b.focus));
        break;
      case "Focus Z-A":
        sorted.sort((a, b) => b.focus.localeCompare(a.focus));
        break;
      default:
        break;
    }

    return sorted;
  }, [rows, search, sortOption]);

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  return (
    <div className="rounded-[30px] border border-[#d9d9d9] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex w-full max-w-[400px] items-center rounded-[100px] border border-[#b4b4b4] bg-white px-5 py-[10px]">
          <SearchIcon className="pointer-events-none absolute left-5 h-4.5 w-4.5 text-[#6c6c6c]" />
          <input
            className="w-full pl-8 text-sm text-[#6c6c6c] placeholder:text-[#6c6c6c] focus:outline-none"
            placeholder="Search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="relative">
          <button
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#b4b4b4] bg-white"
            type="button"
            aria-label="Open filters"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
          >
            <FilterIcon
              className={`h-5 w-5 ${showFilterMenu ? "text-[#3b9a9a]" : "text-[#6c6c6c]"}`}
            />
          </button>

          {showFilterMenu && (
            <div className="absolute right-0 top-14 z-20">
              <FilteringMenu />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[20px] border border-[#d9d9d9] bg-white">
        <div className="grid grid-cols-[1.5fr_1.2fr_0.6fr] items-center border-b border-[#d9d9d9] px-4 py-3 text-sm font-semibold text-black">
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <SortArrowIcon
                className={`h-3 w-3 ${showSortMenu ? "text-[#3b9a9a]" : "text-[#1f1f1f]"}`}
              />
              <span>Name</span>
            </button>

            {showSortMenu && (
              <div className="absolute left-0 top-6 z-20 font-normal">
                <SortMenuPopup
                  selected={sortOption}
                  onSelect={(option) => {
                    setSortOption(option);
                    setShowSortMenu(false);
                  }}
                />
              </div>
            )}
          </div>
          <span>Focus</span>
          <span>Year</span>
        </div>

        <div className="divide-y divide-[#d9d9d9]">
          {filteredRows.map((row, index) => {
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

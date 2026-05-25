import React, { useEffect, useMemo, useRef, useState } from "react";

import FilteringMenu from "./filteringmenu/FilteringMenu";
import { FilterIcon, SearchIcon, SortArrowIcon } from "./icons/AppIcons";
import SortMenuPopup from "./SortMenuPopup";

import type { OrganizationTag } from "@/api/organization";

import { getTags } from "@/api/tags";

export type Row = {
  id: string;
  name: string;
  focus: string;
  year: string;
  tags: OrganizationTag[];
};

const MAX_VISIBLE_TAGS = 3;

function getDarkerShade(hex: string): string {
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (expanded.length !== 6) return "#1f1f1f";

  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return "#1f1f1f";

  // Darken in HSL so we keep the hue and just drop lightness.
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;
  const delta = max - min;

  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / delta + 2;
        break;
      default:
        h = (rNorm - gNorm) / delta + 4;
    }
    h *= 60;
  }

  const targetL = Math.max(0.18, l - 0.55);
  const targetS = Math.min(1, s + 0.05);

  const hueToRgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  let outR = targetL;
  let outG = targetL;
  let outB = targetL;
  if (targetS !== 0) {
    const q = targetL < 0.5 ? targetL * (1 + targetS) : targetL + targetS - targetL * targetS;
    const p = 2 * targetL - q;
    const hh = h / 360;
    outR = hueToRgb(p, q, hh + 1 / 3);
    outG = hueToRgb(p, q, hh);
    outB = hueToRgb(p, q, hh - 1 / 3);
  }

  const toHex = (v: number): string =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(outR)}${toHex(outG)}${toHex(outB)}`;
}

type TagChipListProps = {
  tags: OrganizationTag[];
  isActive: boolean;
};

function TagChipList({ tags, isActive }: TagChipListProps) {
  const safeTags = tags ?? [];
  if (safeTags.length === 0) {
    return <span className={isActive ? "font-semibold" : "text-[#6c6c6c]"}>—</span>;
  }

  const visibleTags = safeTags.slice(0, MAX_VISIBLE_TAGS);
  const overflowTags = safeTags.slice(MAX_VISIBLE_TAGS);
  const overflowCount = overflowTags.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibleTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
          style={{ backgroundColor: tag.color, color: getDarkerShade(tag.color) }}
        >
          {tag.name}
        </span>
      ))}
      {overflowCount > 0 && (
        <span
          className="inline-flex items-center rounded-full border border-[#d9d9d9] bg-white px-2 py-0.5 text-xs font-medium text-[#6c6c6c]"
          title={overflowTags.map((tag) => tag.name).join(", ")}
        >
          +{overflowCount}
        </span>
      )}
    </div>
  );
}

type NpoListViewProps = {
  rows: Row[];
  selectedId?: string | null;
  onSelect?: (row: Row) => void;
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function NpoListView({ rows, selectedId, onSelect }: NpoListViewProps) {
  const [search, setSearch] = useState("");
  const [focusAreaOptions, setFocusAreaOptions] = useState<string[]>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(true);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const tagsAbortRef = useRef<AbortController | null>(null);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length === 0) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(query));
  }, [rows, search]);

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    tagsAbortRef.current?.abort();
    const abortController = new AbortController();
    tagsAbortRef.current = abortController;
    setIsTagsLoading(true);
    setTagsError(null);

    const loadTags = async () => {
      try {
        const tags = await getTags(abortController.signal);
        setFocusAreaOptions(tags);
      } catch (error) {
        if (!isAbortError(error)) {
          setFocusAreaOptions([]);
          setTagsError("Unable to load focus areas.");
        }
      } finally {
        if (tagsAbortRef.current === abortController) {
          setIsTagsLoading(false);
        }
      }
    };

    void loadTags();
    return () => abortController.abort();
  }, []);

  const focusAreaState = isTagsLoading
    ? "loading"
    : tagsError
      ? "error"
      : focusAreaOptions.length > 0
        ? "ready"
        : "empty";

  return (
    <section className="rounded-[30px] border border-[#d9d9d9] bg-white px-5 pb-[31px] pt-[20px]">
      <div className="flex flex-col gap-[36px]">
        <div className="flex items-center gap-[8px] pr-[13px]">
          <label className="relative block w-[240px] md:w-[363px]">
            <span className="sr-only">Search NPO</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon className="h-[18px] w-[18px] text-[#6c6c6c]" />
            </span>
            <input
              type="search"
              placeholder="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-[44px] w-full rounded-[100px] border border-[#b4b4b4] bg-white pl-[42px] pr-4 text-[14px] text-[#484848] placeholder:text-[#6c6c6c] outline-none"
            />
          </label>

          <div className="relative">
            <button
              type="button"
              aria-label="Open filters"
              className="flex h-[44px] w-[44px] items-center justify-center rounded-[60px] border border-[#b4b4b4]"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <FilterIcon
                className={`h-[18px] w-[18px] ${showFilterMenu ? "text-[#3b9a9a]" : "text-[#6c6c6c]"}`}
              />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 top-14 z-20">
                <FilteringMenu
                  focusAreaOptions={focusAreaOptions}
                  focusAreaState={focusAreaState}
                  focusAreaErrorMessage={tagsError}
                />
              </div>
            )}
          </div>
        </div>

        <div>
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
                  <SortMenuPopup />
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
                  <TagChipList tags={row.tags} isActive={isActive} />
                  <span className={isActive ? "font-semibold" : "text-[#1f1f1f]"}>{row.year}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default NpoListView;

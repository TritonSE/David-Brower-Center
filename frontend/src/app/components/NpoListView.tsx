import Image from "next/image";
import React from "react";

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

const searchIcon = "https://www.figma.com/api/mcp/asset/8a385201-906e-4dcd-87d6-750c7743eb0a";
const filterIcon = "https://www.figma.com/api/mcp/asset/2db5901d-2e8c-4547-b351-9ba7b129c7a7";
const arrowIcon = "https://www.figma.com/api/mcp/asset/8c624ada-485b-4aee-8a63-7367b03ab02c";

export function NpoListView({ rows, selectedId, onSelect }: NpoListViewProps) {
  return (
    <div className="rounded-[30px] border border-[#d9d9d9] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex w-full max-w-[400px] items-center rounded-[100px] border border-[#b4b4b4] bg-white px-5 py-[10px]">
          <Image
            alt="Search"
            src={searchIcon}
            className="pointer-events-none absolute left-5 h-4.5 w-4.5 object-contain"
            width={18}
            height={18}
            unoptimized
          />
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
          <Image
            alt="Filters"
            src={filterIcon}
            className="h-5 w-5 object-contain"
            width={20}
            height={20}
            unoptimized
          />
        </button>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-[#d9d9d9]">
        <div className="grid grid-cols-[1.5fr_1.2fr_0.6fr] items-center border-b border-[#d9d9d9] bg-white px-4 py-3 text-sm font-semibold text-black">
          <div className="flex items-center gap-2">
            <Image
              alt="Sort"
              src={arrowIcon}
              className="h-3 w-3 object-contain"
              width={12}
              height={12}
              unoptimized
            />
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

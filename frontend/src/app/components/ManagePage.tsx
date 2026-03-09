"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import PageNavBar from "./PageNavBar";

type ManageStatus = "published" | "draft";

type ManageRow = {
  id: string;
  name: string;
  updatedAt: string;
  status: ManageStatus;
};

const IMG_EYE = "/icons/manage/eye.svg";
const IMG_ADD = "/icons/manage/add-square.svg";
const IMG_EDIT = "/icons/manage/edit.svg";

const MOCK_ROWS: ManageRow[] = [
  { id: "npo-1", name: "NPO Organization", updatedAt: "Jan 12, 2026 3:55pm", status: "published" },
  { id: "npo-2", name: "NPO Organization", updatedAt: "Jan 12, 2026 3:55pm", status: "published" },
  { id: "npo-3", name: "NPO Organization", updatedAt: "Jan 12, 2026 3:55pm", status: "published" },
  { id: "npo-4", name: "NPO Organization", updatedAt: "Jan 12, 2026 3:55pm", status: "draft" },
];

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[18px] w-[18px] text-[#6c6c6c]"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[18px] w-[18px] text-[#6c6c6c]"
      aria-hidden="true"
    >
      <path
        d="M3 7h18M3 12h18M3 17h18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="8" cy="7" r="2.2" fill="white" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="15" cy="12" r="2.2" fill="white" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="11" cy="17" r="2.2" fill="white" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SortArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[14px] w-[13px] text-black"
      aria-hidden="true"
    >
      <path d="M12 4v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="m7 13 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ManagePage() {
  const [activeTab, setActiveTab] = useState<ManageStatus>("published");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const publishedCount = useMemo(
    () => MOCK_ROWS.filter((row) => row.status === "published").length,
    [],
  );
  const draftCount = useMemo(() => MOCK_ROWS.filter((row) => row.status === "draft").length, []);

  const visibleRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return MOCK_ROWS.filter((row) => {
      if (row.status !== activeTab) return false;
      if (!query) return true;
      return row.name.toLowerCase().includes(query);
    });
  }, [activeTab, searchQuery]);

  function handleToggleRow(rowId: string) {
    setSelectedIds((current) =>
      current.includes(rowId) ? current.filter((value) => value !== rowId) : [...current, rowId],
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f9f8] px-4 py-6 md:px-8 lg:px-10">
      <PageNavBar activeTab="manage" />

      <section className="rounded-[30px] border border-[#d9d9d9] bg-white px-5 pb-[31px] pt-[20px]">
        <div className="flex flex-col gap-[36px]">
          <div className="flex items-center justify-between gap-[24px] pr-[13px]">
            <div className="flex items-center gap-[8px]">
              <label className="relative block w-[240px] md:w-[363px]">
                <span className="sr-only">Search NPO</span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-[44px] w-full rounded-[100px] border border-[#b4b4b4] bg-white pl-[42px] pr-4 text-[14px] text-[#484848] outline-none"
                />
              </label>

              <button
                type="button"
                aria-label="Open filters"
                className="flex h-[44px] w-[44px] items-center justify-center rounded-[60px] border border-[#b4b4b4]"
              >
                <FilterIcon />
              </button>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-[12px] font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[17px] font-semibold text-[#3b9a9a]"
            >
              <Image src={IMG_ADD} alt="" width={18} height={18} className="h-[18px] w-[18px]" />
              <span>Add NPO</span>
            </button>
          </div>

          <div className="flex flex-col gap-[24px]">
            <div className="flex items-center gap-[17px]">
              <button
                type="button"
                onClick={() => setActiveTab("published")}
                className={classNames(
                  "relative pb-[1px] font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[16px] leading-6",
                  activeTab === "published" ? "text-black" : "text-[#484848]",
                )}
              >
                Published ({publishedCount})
                <span
                  className={classNames(
                    "absolute bottom-0 left-0 h-px bg-black transition-all",
                    activeTab === "published" ? "w-full" : "w-0",
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("draft")}
                className={classNames(
                  "relative pb-[1px] font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[16px] leading-6",
                  activeTab === "draft" ? "text-black" : "text-[#484848]",
                )}
              >
                Drafts ({draftCount})
                <span
                  className={classNames(
                    "absolute bottom-0 left-0 h-px bg-black transition-all",
                    activeTab === "draft" ? "w-full" : "w-0",
                  )}
                />
              </button>
            </div>

            <div className="border-b border-black py-4 pl-8 pr-16">
              <div className="flex items-center">
                <div className="flex flex-1 items-center gap-1">
                  <span className="inline-flex items-center justify-center">
                    <SortArrowIcon />
                  </span>
                  <span className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[16px] text-black">
                    NPO
                  </span>
                </div>
                <span className="flex-1 text-center font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[16px] text-black whitespace-nowrap">
                  Last Updated
                </span>
                <span className="flex-1" />
              </div>
            </div>

            <div>
              {visibleRows.map((row, index) => {
                const striped = index % 2 === 0;
                const selected = selectedIds.includes(row.id);

                return (
                  <div
                    key={row.id}
                    className={classNames(
                      "border-b border-[#b4b4b4] py-3 pl-8 pr-16",
                      striped ? "bg-[#f2f9f8]" : "bg-white",
                    )}
                  >
                    <div className="flex items-center">
                      <div className="flex flex-1 items-center gap-[10px]">
                        <label className="flex h-5 w-5 cursor-pointer items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => handleToggleRow(row.id)}
                            className="h-5 w-5 rounded-[3px] border border-[#909090] accent-[#3b9a9a]"
                            aria-label={`Select ${row.name}`}
                          />
                        </label>
                        <span className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[14px] tracking-[0.28px] text-black">
                          {row.name}
                        </span>
                      </div>

                      <span className="flex-1 text-center font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[14px] leading-5 text-[#484848] whitespace-nowrap">
                        {row.updatedAt}
                      </span>

                      <div className="flex flex-1 items-center justify-end gap-8">
                        <button type="button" aria-label={`View ${row.name}`}>
                          <span className="flex h-[22px] w-[22px] items-center justify-center">
                            <Image
                              src={IMG_EYE}
                              alt=""
                              width={22}
                              height={22}
                              className="block h-[18px] w-[22px] object-contain"
                            />
                          </span>
                        </button>
                        <button type="button" aria-label={`Edit ${row.name}`}>
                          <span className="flex h-[22px] w-[22px] items-center justify-center">
                            <Image
                              src={IMG_EDIT}
                              alt=""
                              width={20}
                              height={20}
                              className="block h-[20px] w-[20px] object-contain"
                            />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

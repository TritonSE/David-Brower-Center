"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FilterIcon, SearchIcon, SortArrowIcon } from "./icons/AppIcons";

import type { OrganizationListItem } from "@/api/organization";

import { getOrganizations } from "@/api/organization";

type ManageStatus = "published" | "draft";

const IMG_EYE = "/icons/manage/eye.svg";
const IMG_ADD = "/icons/manage/add-square.svg";
const IMG_EDIT = "/icons/manage/edit.svg";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ManagePage() {
  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ManageStatus>("published");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  const fetchOrganizations = useCallback(async () => {
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getOrganizations(abortController.signal);
      setOrganizations(data);
    } catch (error) {
      if (isAbortError(error)) return;
      setOrganizations([]);
      setLoadError(getErrorMessage(error, "Unable to load organizations."));
    } finally {
      if (abortRef.current === abortController) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchOrganizations();
    return () => abortRef.current?.abort();
  }, [fetchOrganizations]);

  const handleRetry = useCallback(() => {
    void fetchOrganizations();
  }, [fetchOrganizations]);

  const publishedRows = useMemo(() => organizations, [organizations]);
  const draftRows: OrganizationListItem[] = [];

  const publishedCount = publishedRows.length;
  const draftCount = draftRows.length;

  const visibleRows = useMemo(() => {
    const source = activeTab === "published" ? publishedRows : draftRows;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return source;
    return source.filter((row) => row.name.toLowerCase().includes(query));
  }, [activeTab, publishedRows, searchQuery]);

  function handleToggleRow(rowId: string) {
    setSelectedIds((current) =>
      current.includes(rowId) ? current.filter((value) => value !== rowId) : [...current, rowId],
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-[30px] border border-[#d9d9d9] bg-white p-6 text-sm text-[#6c6c6c] shadow-sm">
        Loading organizations...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-[30px] border border-[#d9d9d9] bg-white p-6 shadow-sm">
        <p className="text-sm text-[#484848]">{loadError}</p>
        <button
          className="mt-3 rounded-[40px] bg-[#3b9a9a] px-4 py-2 text-sm font-semibold text-white"
          type="button"
          onClick={handleRetry}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <section className="rounded-[30px] border border-[#d9d9d9] bg-white px-5 pb-[31px] pt-[20px]">
        <div className="flex flex-col gap-[36px]">
          <div className="flex items-center justify-between gap-[24px] pr-[13px]">
            <div className="flex items-center gap-[8px]">
              <label className="relative block w-[240px] md:w-[363px]">
                <span className="sr-only">Search NPO</span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <SearchIcon className="h-[18px] w-[18px] text-[#6c6c6c]" />
                </span>
                <input
                  type="search"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-[44px] w-full rounded-[100px] border border-[#b4b4b4] bg-white pl-[42px] pr-4 text-[14px] text-[#484848] placeholder:text-[#6c6c6c] outline-none"
                />
              </label>

              <button
                type="button"
                aria-label="Open filters"
                className="flex h-[44px] w-[44px] items-center justify-center rounded-[60px] border border-[#b4b4b4]"
              >
                <FilterIcon className="h-[18px] w-[18px] text-[#6c6c6c]" />
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
                    <SortArrowIcon className="h-[14px] w-[13px] text-black" />
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
              {visibleRows.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#6c6c6c]">
                  {searchQuery.trim()
                    ? "No organizations match your search."
                    : "No organizations found."}
                </div>
              ) : (
                visibleRows.map((row, index) => {
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
                        <div className="flex w-1/3 shrink-0 items-center gap-[10px]">
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
                          {formatDate(row.updatedAt)}
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
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

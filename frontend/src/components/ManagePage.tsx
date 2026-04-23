"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AddNpoPopup from "./AddNpoPopup";
import {
  FilterIcon,
  LeafIcon,
  LocationIcon,
  MoneyIcon,
  PeopleIcon,
  SearchIcon,
  SortArrowIcon,
} from "./icons/AppIcons";
import NpoProfileCard from "./NpoProfileCard";

import type { OrganizationDetail, OrganizationListItem } from "@/api/organization";

import { createOrganization, getOrganizationById, getOrganizations } from "@/api/organization";

type ManageStatus = "published" | "draft";

const IMG_EYE = "/icons/manage/eye.svg";
const IMG_ADD = "/icons/manage/add-square.svg";
const IMG_EDIT = "/icons/manage/edit.svg";
const POPUP_FADE_DURATION_MS = 200;

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

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [activeOrgDetail, setActiveOrgDetail] = useState<OrganizationDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isCardVisible, setIsCardVisible] = useState(false);

  const [isAddNpoOpen, setIsAddNpoOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationListItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const detailAbortRef = useRef<AbortController | null>(null);
  const detailRequestIdRef = useRef(0);

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

  const fetchOrganizationDetail = useCallback(async (organizationId: string) => {
    detailAbortRef.current?.abort();
    const abortController = new AbortController();
    detailAbortRef.current = abortController;
    const requestId = detailRequestIdRef.current + 1;
    detailRequestIdRef.current = requestId;

    setIsDetailLoading(true);
    setDetailError(null);
    setActiveOrgDetail(null);

    try {
      const detail = await getOrganizationById(organizationId, abortController.signal);
      if (detailRequestIdRef.current !== requestId) return;
      setActiveOrgDetail(detail);
    } catch (error) {
      if (isAbortError(error) || detailRequestIdRef.current !== requestId) return;
      setDetailError(getErrorMessage(error, "Unable to load organization details."));
    } finally {
      if (detailRequestIdRef.current === requestId) {
        setIsDetailLoading(false);
      }
    }
  }, []);

  useEffect(() => () => detailAbortRef.current?.abort(), []);

  useEffect(() => {
    if (!isCardVisible && selectedOrgId) {
      const timer = setTimeout(() => {
        setSelectedOrgId(null);
        setActiveOrgDetail(null);
        setDetailError(null);
        setIsDetailLoading(false);
      }, POPUP_FADE_DURATION_MS);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isCardVisible, selectedOrgId]);

  const handleViewOrg = useCallback(
    (orgId: string) => {
      if (selectedOrgId === orgId && isCardVisible) {
        detailAbortRef.current?.abort();
        setIsCardVisible(false);
        return;
      }

      setSelectedOrgId(orgId);
      setIsCardVisible(true);
      void fetchOrganizationDetail(orgId);
    },
    [fetchOrganizationDetail, isCardVisible, selectedOrgId],
  );

  const handleRetryDetail = useCallback(() => {
    if (!selectedOrgId) return;
    void fetchOrganizationDetail(selectedOrgId);
  }, [fetchOrganizationDetail, selectedOrgId]);

  const handleCloseCard = useCallback(() => {
    detailAbortRef.current?.abort();
    setIsCardVisible(false);
  }, []);

  const handleCreateOrganization = useCallback(
    async (values: { title: string; description: string }) => {
      if (isCreating) return;

      setIsCreating(true);

      try {
        await createOrganization({
          name: values.title.trim(),
          mission: values.description.trim() || undefined,
        });

        setIsAddNpoOpen(false);
        setEditingOrg(null);
        void fetchOrganizations();
      } catch (error: unknown) {
        console.error("Failed to create organization:", error);
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, fetchOrganizations],
  );

  const selectedRow = useMemo(
    () => organizations.find((org) => org.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId],
  );

  const selectedCardProps = useMemo(() => {
    if (!activeOrgDetail) return null;
    return {
      name: activeOrgDetail.name,
      tags: [
        {
          icon: <LeafIcon className="h-[18px] w-[18px] text-[#6c6c6c]" />,
          label: activeOrgDetail.focus,
        },
        {
          icon: <PeopleIcon className="h-4 w-4 text-[#6c6c6c]" />,
          label: activeOrgDetail.size,
        },
        {
          icon: <MoneyIcon className="h-[14px] w-[14px] text-[#6c6c6c]" />,
          label: activeOrgDetail.budget,
        },
        {
          icon: <LocationIcon className="h-[14px] w-[14px] text-[#6c6c6c]" />,
          label: activeOrgDetail.location,
        },
      ],
      description: activeOrgDetail.description,
      mission: activeOrgDetail.mission,
    };
  }, [activeOrgDetail]);

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
              onClick={() => {
                setEditingOrg(null);
                setIsAddNpoOpen(true);
              }}
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
                          <button
                            type="button"
                            aria-label={`View ${row.name}`}
                            onClick={() => handleViewOrg(row.id)}
                          >
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
                          <button
                            type="button"
                            aria-label={`Edit ${row.name}`}
                            onClick={() => {
                              setEditingOrg(row);
                              setIsAddNpoOpen(true);
                            }}
                          >
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

      <div
        className={`pointer-events-none fixed inset-0 z-20 flex items-center justify-end px-4 py-8 md:px-8 lg:px-10 transition-opacity duration-200 ${
          isCardVisible && selectedOrgId ? "opacity-100" : "opacity-0"
        }`}
      >
        {selectedOrgId ? (
          <div
            className="pointer-events-auto max-w-160 rounded-[30px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.1)] transition-transform duration-200"
            style={{ transform: isCardVisible ? "translateY(0)" : "translateY(8px)" }}
          >
            {selectedCardProps ? (
              <NpoProfileCard {...selectedCardProps} onClose={handleCloseCard} />
            ) : (
              <section className="relative w-full max-w-[600px] rounded-[30px] border border-[#d9d9d9] bg-[#f5f5f5] px-5 pb-5 pt-6 sm:px-[28px] sm:pt-[27px]">
                <button
                  type="button"
                  aria-label="Close"
                  onClick={handleCloseCard}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#6c6c6c] transition-colors hover:bg-black/10 hover:text-black"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <h1 className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[28px]/[normal] font-bold text-black sm:text-[32px]">
                  {selectedRow?.name ?? "Organization"}
                </h1>

                {isDetailLoading ? (
                  <p className="mt-3 font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-sm text-[#484848]">
                    Loading organization details...
                  </p>
                ) : detailError ? (
                  <div className="mt-3 space-y-3">
                    <p className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-sm text-[#484848]">
                      {detailError}
                    </p>
                    <button
                      className="rounded-[40px] bg-[#3b9a9a] px-4 py-2 text-sm font-semibold text-white"
                      type="button"
                      onClick={handleRetryDetail}
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-sm text-[#484848]">
                    No organization details available.
                  </p>
                )}
              </section>
            )}
          </div>
        ) : null}
      </div>

      <AddNpoPopup
        open={isAddNpoOpen}
        onClose={() => {
          setIsAddNpoOpen(false);
          setEditingOrg(null);
        }}
        onNext={(values) => void handleCreateOrganization(values)}
        initialTitle={editingOrg?.name ?? ""}
      />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AccountRequestsPanel from "./AccountRequestsPanel";
import AddNpoPopup from "./AddNpoPopup";
import AddNpoSuccessMessage from "./AddNpoSuccessMessage";
import {
  LeafIcon,
  LocationIcon,
  ManageAddIcon,
  ManageEditIcon,
  ManageEyeIcon,
  ManageFilterIcon,
  ManageSearchIcon,
  ManageSortIcon,
  MoneyIcon,
  PeopleIcon,
  TrashIcon,
} from "./icons/AppIcons";
import TagDashboard from "./manage/TagDashboard";
import {
  type AssignedOrganization,
  type ManageTag,
  type ManageTagDraft,
  toManageTag,
} from "./manage/types";
import NpoProfileCard, { getNpoProfileCardImageProps } from "./NpoProfileCard";
import UsersPanel from "./UsersPanel";

import type { OrganizationDetail } from "@/api/organization";
import type { APIResult } from "@/api/request";
import type { TagRecord } from "@/api/tags";

import { deleteOrganization, getOrganizationById } from "@/api/organization";
import { deleteTag, getManageTags, updateTag } from "@/api/tags";
import { useOrganizations } from "@/contexts/OrganizationsContext";
import { proximaFontStyle } from "@/styles/fontStyles";

type ManageMode = "npos" | "tags" | "requests" | "users";

const NOT_PROVIDED = "Not provided";

function detailStringToFormValue(value: string): string {
  return value === NOT_PROVIDED ? "" : value;
}

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

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
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
  const {
    organizations,
    isLoading,
    error: loadError,
    refetch: refetchOrganizations,
  } = useOrganizations();

  const [activeManageMode, setActiveManageMode] = useState<ManageMode>("npos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [manageTags, setManageTags] = useState<ManageTag[]>([]);
  const [accountRequestCount, setAccountRequestCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [activeOrgDetail, setActiveOrgDetail] = useState<OrganizationDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isCardVisible, setIsCardVisible] = useState(false);

  const [isAddNpoOpen, setIsAddNpoOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState<OrganizationDetail | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRemoveNpoConfirmOpen, setIsRemoveNpoConfirmOpen] = useState(false);
  const [isRemovingNpo, setIsRemovingNpo] = useState(false);
  const [removeNpoError, setRemoveNpoError] = useState<string | null>(null);

  const detailAbortRef = useRef<AbortController | null>(null);
  const detailRequestIdRef = useRef(0);
  const editAbortRef = useRef<AbortController | null>(null);

  const handleRetry = useCallback(() => {
    void refetchOrganizations();
  }, [refetchOrganizations]);

  useEffect(() => {
    const abortController = new AbortController();
    void (async () => {
      try {
        const tags = await getManageTags(abortController.signal);
        if (abortController.signal.aborted) return;
        setManageTags(
          tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            color: tag.color,
            visibility: tag.visibility,
            assignedOrganizations: tag.assignedOrganizations,
          })),
        );
      } catch (error) {
        if (abortController.signal.aborted) return;
        console.error("Failed to load tags", error);
      }
    })();
    return () => abortController.abort();
  }, []);

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
      const result: APIResult<OrganizationDetail> = await getOrganizationById(
        organizationId,
        abortController.signal,
      );
      if (result.success) {
        if (detailRequestIdRef.current !== requestId) return;
        setActiveOrgDetail(result.data);
        return;
      }
      if (detailRequestIdRef.current !== requestId) return;
      setDetailError(result.error || "Unable to load organization details.");
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

  const selectedRow = useMemo(
    () => organizations.find((org) => org.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId],
  );

  const selectedCardProps = useMemo(() => {
    if (!activeOrgDetail) return null;
    return {
      organizationId: activeOrgDetail.id,
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
      ...getNpoProfileCardImageProps(activeOrgDetail.images),
      mission: activeOrgDetail.mission,
    };
  }, [activeOrgDetail]);

  const npoCount = organizations.length;
  const tagCount = manageTags.length;
  const availableTagOrganizations = useMemo<AssignedOrganization[]>(
    () =>
      organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        website: null,
      })),
    [organizations],
  );

  const visibleRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return organizations;
    return organizations.filter((row) => row.name.toLowerCase().includes(query));
  }, [organizations, searchQuery]);

  function handleToggleRow(rowId: string) {
    setSelectedIds((current) =>
      current.includes(rowId) ? current.filter((value) => value !== rowId) : [...current, rowId],
    );
  }

  // Limit removal to selected rows that are still visible in the current list.
  const selectedVisibleNpoIds = useMemo(
    () => selectedIds.filter((id) => visibleRows.some((row) => row.id === id)),
    [selectedIds, visibleRows],
  );
  const removeNpoDisabled = selectedVisibleNpoIds.length === 0;

  const handleConfirmRemoveNpo = async () => {
    if (isRemovingNpo || selectedVisibleNpoIds.length === 0) return;
    setIsRemovingNpo(true);
    setRemoveNpoError(null);

    const outcomes = await Promise.all(
      selectedVisibleNpoIds.map(async (id) => {
        try {
          const result = await deleteOrganization(id);
          return { id, ok: result.success };
        } catch {
          return { id, ok: false };
        }
      }),
    );

    const removedIds = outcomes.filter((outcome) => outcome.ok).map((outcome) => outcome.id);
    const failureCount = outcomes.length - removedIds.length;

    if (removedIds.length > 0) {
      setSelectedIds((current) => current.filter((value) => !removedIds.includes(value)));
      void refetchOrganizations();
    }

    setIsRemovingNpo(false);
    if (failureCount > 0) {
      setRemoveNpoError(`Unable to remove ${failureCount.toString()} organization(s).`);
    } else {
      setIsRemoveNpoConfirmOpen(false);
    }
  };

  const handleTagCreated = useCallback((tag: TagRecord) => {
    const nextTag = toManageTag(tag);
    setManageTags((current: ManageTag[]) => [
      nextTag,
      ...current.filter((existingTag) => existingTag.id !== nextTag.id),
    ]);
  }, []);

  const handleTagUpdated = useCallback(async (tagId: string, updates: ManageTagDraft) => {
    try {
      await updateTag(tagId, {
        name: updates.name,
        color: updates.color,
        visibility: updates.visibility,
      });
      setManageTags((current) =>
        current.map((tag) => (tag.id === tagId ? { ...tag, ...updates } : tag)),
      );
    } catch (error) {
      console.error("Failed to update tag", error);
    }
  }, []);

  const handleTagOrganizationsUpdated = useCallback(
    async (tagId: string, assignedOrganizations: AssignedOrganization[]) => {
      try {
        await updateTag(tagId, {
          organizationIds: assignedOrganizations.map((organization) => organization.id),
        });
        setManageTags((current) =>
          current.map((tag) => (tag.id === tagId ? { ...tag, assignedOrganizations } : tag)),
        );
      } catch (error) {
        console.error("Failed to update tag organizations", error);
      }
    },
    [],
  );

  const handleTagDeleted = useCallback(async (tagId: string) => {
    if (looksLikeUuid(tagId)) {
      await deleteTag(tagId);
    }

    setManageTags((current) => current.filter((tag) => tag.id !== tagId));
  }, []);

  const handleCloseAddNpo = useCallback(() => {
    setIsAddNpoOpen(false);
    setEditingDetail(null);
  }, []);

  const handleEditOrg = useCallback(async (orgId: string) => {
    editAbortRef.current?.abort();
    const abortController = new AbortController();
    editAbortRef.current = abortController;

    setEditLoadingId(orgId);

    try {
      const result = await getOrganizationById(orgId, abortController.signal);
      if (abortController.signal.aborted) return;

      if (!result.success) {
        setToastMessage(result.error || "Unable to load organization for editing.");
        return;
      }

      setEditingDetail(result.data);
      setIsAddNpoOpen(true);
    } catch (error) {
      if (isAbortError(error)) return;
      setToastMessage(getErrorMessage(error, "Unable to load organization for editing."));
    } finally {
      if (editAbortRef.current === abortController) {
        editAbortRef.current = null;
        setEditLoadingId(null);
      }
    }
  }, []);

  useEffect(() => () => editAbortRef.current?.abort(), []);

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
      <section
        className="rounded-[30px] border border-[#d9d9d9] bg-white px-5 pb-[31px] pt-[20px]"
        style={proximaFontStyle}
      >
        <div className="flex flex-col gap-[36px]">
          <div className="flex items-center justify-between gap-[24px]">
            <h1 className="font-proxima text-[24px] font-semibold tracking-[0.48px] text-black">
              Dashboard
            </h1>
            <div className="h-4 flex-1" />
          </div>

          <div className="flex flex-col gap-[24px]">
            <div className="flex items-center gap-[17px] border-b border-[#d9d9d9] pb-[8px]">
              <button
                type="button"
                onClick={() => setActiveManageMode("npos")}
                className={classNames(
                  "font-proxima relative pb-[1px] text-[16px] leading-6",
                  activeManageMode === "npos"
                    ? "font-semibold text-[#3b9a9a]"
                    : "font-normal text-[#484848]",
                )}
              >
                NPOs ({npoCount})
                <span
                  className={classNames(
                    "absolute bottom-[-9px] left-0 h-px bg-[#3b9a9a] transition-all",
                    activeManageMode === "npos" ? "w-full" : "w-0",
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => setActiveManageMode("tags")}
                className={classNames(
                  "font-proxima relative pb-[1px] text-[16px] leading-6",
                  activeManageMode === "tags"
                    ? "font-semibold text-[#3b9a9a]"
                    : "font-normal text-[#484848]",
                )}
              >
                Tags ({tagCount})
                <span
                  className={classNames(
                    "absolute bottom-[-9px] left-0 h-px bg-[#3b9a9a] transition-all",
                    activeManageMode === "tags" ? "w-full" : "w-0",
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => setActiveManageMode("users")}
                className={classNames(
                  "font-proxima relative pb-[1px] text-[16px] leading-6",
                  activeManageMode === "users"
                    ? "font-semibold text-[#3b9a9a]"
                    : "font-normal text-[#484848]",
                )}
              >
                Users ({userCount})
                <span
                  className={classNames(
                    "absolute bottom-[-9px] left-0 h-px bg-[#3b9a9a] transition-all",
                    activeManageMode === "users" ? "w-full" : "w-0",
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => setActiveManageMode("requests")}
                className={classNames(
                  "font-proxima relative pb-[1px] text-[16px] leading-6",
                  activeManageMode === "requests"
                    ? "font-semibold text-[#3b9a9a]"
                    : "font-normal text-[#484848]",
                )}
              >
                Account Requests ({accountRequestCount})
                <span
                  className={classNames(
                    "absolute bottom-[-9px] left-0 h-px bg-[#3b9a9a] transition-all",
                    activeManageMode === "requests" ? "w-full" : "w-0",
                  )}
                />
              </button>
            </div>

            {activeManageMode === "npos" ? (
              <>
                <div className="flex items-center justify-between gap-[24px] pr-[13px]">
                  <div className="flex items-center gap-[8px]">
                    <label className="relative block w-[240px] md:w-[363px]">
                      <span className="sr-only">Search NPO</span>
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                        <ManageSearchIcon className="h-[18px] w-[18px] text-[#6c6c6c]" />
                      </span>
                      <input
                        type="search"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="h-[44px] w-full rounded-[100px] border border-[#b4b4b4] bg-white pl-[42px] pr-4 text-[16px] font-normal text-[#484848] placeholder:text-[#6c6c6c] outline-none"
                      />
                    </label>

                    <button
                      type="button"
                      aria-label="Open filters"
                      className="flex h-[44px] w-[44px] items-center justify-center rounded-[60px] border border-[#b4b4b4]"
                    >
                      <ManageFilterIcon className="h-[20px] w-[20px] text-[#6c6c6c]" />
                    </button>
                  </div>

                  <div className="flex items-center gap-[32px]">
                    <button
                      type="button"
                      disabled={removeNpoDisabled}
                      onClick={() => {
                        setRemoveNpoError(null);
                        setIsRemoveNpoConfirmOpen(true);
                      }}
                      className={classNames(
                        "font-proxima inline-flex items-center gap-[8px] text-[17px] font-semibold transition-colors",
                        removeNpoDisabled
                          ? "cursor-not-allowed text-[#909090]"
                          : "text-[#d14343] hover:text-[#b23030]",
                      )}
                    >
                      <TrashIcon className="h-[20px] w-[20px]" />
                      <span>Remove NPO</span>
                    </button>

                    <button
                      type="button"
                      className="font-proxima inline-flex items-center gap-[12px] text-[17px] font-semibold text-[#3b9a9a]"
                      onClick={() => {
                        setEditingDetail(null);
                        setIsAddNpoOpen(true);
                      }}
                    >
                      <ManageAddIcon className="h-[18px] w-[18px]" />
                      <span>Add NPO</span>
                    </button>
                  </div>
                </div>

                {removeNpoError ? (
                  <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {removeNpoError}
                  </div>
                ) : null}

                <div className="flex flex-col">
                  <div className="border-b border-[#d9d9d9] px-4 py-3 text-sm font-semibold text-black">
                    <div className="flex items-center">
                      <div className="flex w-1/3 shrink-0 items-center gap-2">
                        <span className="inline-flex items-center justify-center">
                          <ManageSortIcon className="h-[14px] w-[13px] text-[#1f1f1f]" />
                        </span>
                        <span>NPO</span>
                      </div>
                      <span className="flex-1 text-center whitespace-nowrap">Last Updated</span>
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
                              "border-b border-[#b4b4b4] py-3",
                              striped ? "bg-[#f2f9f8]" : "bg-white",
                            )}
                          >
                            <div className="flex items-center px-4">
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
                                <span className="font-proxima text-[14px] tracking-[0.28px] text-black">
                                  {row.name}
                                </span>
                              </div>

                              <span className="font-proxima flex-1 text-center text-[14px] leading-5 text-[#484848] whitespace-nowrap">
                                {formatDate(row.updatedAt)}
                              </span>

                              <div className="flex flex-1 items-center justify-end gap-8">
                                <button
                                  type="button"
                                  aria-label={`View ${row.name}`}
                                  onClick={() => handleViewOrg(row.id)}
                                >
                                  <span className="flex h-[22px] w-[22px] items-center justify-center">
                                    <ManageEyeIcon className="block h-[18px] w-[22px]" />
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Edit ${row.name}`}
                                  disabled={editLoadingId !== null}
                                  onClick={() => void handleEditOrg(row.id)}
                                >
                                  <span className="flex h-[22px] w-[22px] items-center justify-center">
                                    <ManageEditIcon className="block h-[20px] w-[20px] text-[#6c6c6c]" />
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
              </>
            ) : activeManageMode === "tags" ? (
              <TagDashboard
                availableOrganizations={availableTagOrganizations}
                tags={manageTags}
                onTagCreated={handleTagCreated}
                onTagDeleted={handleTagDeleted}
                onTagOrganizationsUpdated={handleTagOrganizationsUpdated}
                onTagUpdated={handleTagUpdated}
              />
            ) : null}

            {/* Kept mounted so the tab's request count stays accurate even when inactive. */}
            <div className={activeManageMode === "requests" ? "" : "hidden"}>
              <AccountRequestsPanel onCountChange={setAccountRequestCount} />
            </div>

            {/* Kept mounted so the tab's user count stays accurate even when inactive. */}
            <div className={activeManageMode === "users" ? "" : "hidden"}>
              <UsersPanel onCountChange={setUserCount} />
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
            className="pointer-events-auto max-h-[calc(100vh-64px)] max-w-160 overflow-y-auto rounded-[30px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.1)] transition-transform duration-200"
            style={{ transform: isCardVisible ? "translateY(0)" : "translateY(8px)" }}
          >
            {selectedCardProps ? (
              <NpoProfileCard {...selectedCardProps} onClose={handleCloseCard} />
            ) : (
              <section
                className="relative w-full max-w-[600px] rounded-[30px] border border-[#d9d9d9] bg-[#f5f5f5] px-5 pb-5 pt-6 sm:px-[28px] sm:pt-[27px]"
                style={proximaFontStyle}
              >
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
                <h1 className="font-proxima text-[28px]/[normal] font-bold text-black sm:text-[32px]">
                  {selectedRow?.name ?? "Organization"}
                </h1>

                {isDetailLoading ? (
                  <p className="font-proxima mt-3 text-sm text-[#484848]">
                    Loading organization details...
                  </p>
                ) : detailError ? (
                  <div className="mt-3 space-y-3">
                    <p className="font-proxima text-sm text-[#484848]">{detailError}</p>
                    <button
                      className="rounded-[40px] bg-[#3b9a9a] px-4 py-2 text-sm font-semibold text-white"
                      type="button"
                      onClick={handleRetryDetail}
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <p className="font-proxima mt-3 text-sm text-[#484848]">
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
        onClose={handleCloseAddNpo}
        organizations={organizations}
        existingOrgId={editingDetail?.id ?? null}
        initialTitle={editingDetail?.name ?? ""}
        initialDescription={editingDetail ? detailStringToFormValue(editingDetail.description) : ""}
        onRefetch={() => void refetchOrganizations()}
        onPublished={(orgName) =>
          setToastMessage(
            editingDetail
              ? `${orgName} relationships have been saved`
              : `${orgName} has been added`,
          )
        }
      />

      {toastMessage ? (
        <AddNpoSuccessMessage message={toastMessage} onDismiss={() => setToastMessage(null)} />
      ) : null}

      {isRemoveNpoConfirmOpen ? (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isRemovingNpo) {
              setIsRemoveNpoConfirmOpen(false);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-npo-title"
            className="w-full max-w-[420px] rounded-[24px] border border-[#d9d9d9] bg-white p-6"
            style={proximaFontStyle}
          >
            <h3 id="remove-npo-title" className="text-[18px] font-semibold text-black">
              Remove {selectedVisibleNpoIds.length.toString()} organization(s)?
            </h3>
            <p className="mt-2 text-[14px] text-[#484848]">
              This permanently deletes the selected organization(s), including their relationships
              and tag assignments. This cannot be undone.
            </p>
            {removeNpoError ? (
              <p className="mt-3 text-[14px] text-red-600">{removeNpoError}</p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isRemovingNpo}
                onClick={() => setIsRemoveNpoConfirmOpen(false)}
                className="rounded-[40px] border border-[#b4b4b4] px-4 py-2 text-[14px] font-semibold text-[#484848] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemovingNpo}
                onClick={() => void handleConfirmRemoveNpo()}
                className="rounded-[40px] bg-[#d14343] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[#b23030] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRemovingNpo ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LeafIcon, LocationIcon, MoneyIcon, PeopleIcon } from "./icons/AppIcons";
import NpoListView from "./NpoListView";
import NpoProfileCard from "./NpoProfileCard";

import type { Row } from "./NpoListView";

import { getOrganizationById, getOrganizations } from "@/api/organization";

const POPUP_FADE_DURATION_MS = 200;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

export default function HomePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [activeOrgDetail, setActiveOrgDetail] = useState<Awaited<
    ReturnType<typeof getOrganizationById>
  > | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isCardVisible, setIsCardVisible] = useState(false);
  const listAbortRef = useRef<AbortController | null>(null);
  const detailAbortRef = useRef<AbortController | null>(null);
  const detailRequestIdRef = useRef(0);

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedOrgId) ?? null,
    [rows, selectedOrgId],
  );

  const fetchOrganizations = useCallback(async () => {
    listAbortRef.current?.abort();
    const abortController = new AbortController();
    listAbortRef.current = abortController;

    setIsListLoading(true);
    setListError(null);

    try {
      const organizations = await getOrganizations(abortController.signal);
      setRows(organizations);
    } catch (error) {
      if (isAbortError(error)) return;
      setRows([]);
      setListError(getErrorMessage(error, "Unable to load organizations."));
    } finally {
      if (listAbortRef.current === abortController) {
        setIsListLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchOrganizations();
    return () => listAbortRef.current?.abort();
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

  const handleSelect = useCallback(
    (row: Row) => {
      if (selectedOrgId === row.id && isCardVisible) {
        detailAbortRef.current?.abort();
        setIsCardVisible(false);
        return;
      }

      setSelectedOrgId(row.id);
      setIsCardVisible(true);
      void fetchOrganizationDetail(row.id);
    },
    [fetchOrganizationDetail, isCardVisible, selectedOrgId],
  );

  const handleRetryList = useCallback(() => {
    void fetchOrganizations();
  }, [fetchOrganizations]);

  const handleRetryDetail = useCallback(() => {
    if (!selectedOrgId) return;
    void fetchOrganizationDetail(selectedOrgId);
  }, [fetchOrganizationDetail, selectedOrgId]);

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
        {isListLoading ? (
          <div className="rounded-[30px] border border-[#d9d9d9] bg-white p-6 text-sm text-[#6c6c6c] shadow-sm">
            Loading organizations...
          </div>
        ) : listError ? (
          <div className="rounded-[30px] border border-[#d9d9d9] bg-white p-6 shadow-sm">
            <p className="text-sm text-[#484848]">{listError}</p>
            <button
              className="mt-3 rounded-[40px] bg-[#3b9a9a] px-4 py-2 text-sm font-semibold text-white"
              type="button"
              onClick={handleRetryList}
            >
              Retry
            </button>
          </div>
        ) : (
          <NpoListView rows={rows} selectedId={selectedOrgId} onSelect={handleSelect} />
        )}
      </div>

      {/* Overlay card that fades in/out and sits above the page */}
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
              <NpoProfileCard {...selectedCardProps} />
            ) : (
              <section className="w-full max-w-[600px] rounded-[30px] border border-[#d9d9d9] bg-[#f5f5f5] px-5 pb-5 pt-6 sm:px-[28px] sm:pt-[27px]">
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
    </div>
  );
}

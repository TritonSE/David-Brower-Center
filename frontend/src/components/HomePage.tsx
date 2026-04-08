"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { LeafIcon, LocationIcon, MoneyIcon, PeopleIcon } from "./icons/AppIcons";
import NpoListView from "./NpoListView";
import NpoProfileCard from "./NpoProfileCard";

import type { Row } from "./NpoListView";
import type { OrganizationDetail } from "@/api/organization";

import { getOrganizationById, getOrganizations } from "@/api/organization";
const POPUP_FADE_DURATION_MS = 200;

export default function HomePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [activeOrgDetail, setActiveOrgDetail] = useState<OrganizationDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isCardVisible, setIsCardVisible] = useState(false);

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedOrgId) ?? null,
    [rows, selectedOrgId],
  );

  const fetchOrganizations = useCallback(async () => {
    setIsListLoading(true);
    setListError(null);

    const result = await getOrganizations();
    if (result.success) {
      setRows(result.data);
      setIsListLoading(false);
      return;
    }

    setRows([]);
    setListError(result.error || "Unable to load organizations.");
    setIsListLoading(false);
  }, []);

  useEffect(() => {
    void fetchOrganizations();
  }, [fetchOrganizations]);

  const fetchOrganizationDetail = useCallback(async (organizationId: string) => {
    setIsDetailLoading(true);
    setDetailError(null);
    setActiveOrgDetail(null);

    const result = await getOrganizationById(organizationId);
    if (result.success) {
      setActiveOrgDetail(result.data);
      setIsDetailLoading(false);
      return;
    }

    setDetailError(result.error || "Unable to load organization details.");
    setIsDetailLoading(false);
  }, []);

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

  const handleCloseCard = useCallback(() => {
    setIsCardVisible(false);
  }, []);

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
    </div>
  );
}

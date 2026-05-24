"use client";

// NOTE: THIS IS A VIBE CODED PROTOTYPE FOR USER TESTING PURPOSES
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ChevronRightIcon,
  LeafIcon,
  LocationIcon,
  MoneyIcon,
  PeopleIcon,
  SearchIcon,
} from "./icons/AppIcons";
import NpoProfileCard from "./NpoProfileCard";

import type { APIResult } from "@/api/request";
import type React from "react";
import type { GraphCanvasProps, GraphCanvasRef, InternalGraphNode } from "reagraph";

import { getOrganizationById, type OrganizationDetail } from "@/api/organization";
import { useOrganizations } from "@/contexts/OrganizationsContext";

const GraphCanvas = dynamic<GraphCanvasProps>(async () => (await import("reagraph")).GraphCanvas, {
  ssr: false,
}) as unknown as React.ForwardRefExoticComponent<
  GraphCanvasProps & React.RefAttributes<GraphCanvasRef>
>;

type GraphNode = {
  id: string;
  label: string;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

const POPUP_FADE_DURATION_MS = 200;

const FILTER_CATEGORIES = ["Focus Area", "Location", "Size", "Opportunity Type", "Budget"] as const;

type GraphFilterCategory = (typeof FILTER_CATEGORIES)[number];

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

export default function GraphPage() {
  // LANDING STATE: static tree until user explicitly opens the interactive graph
  const [showFunctionalGraph, setShowFunctionalGraph] = useState(false);

  const {
    organizations,
    relationships,
    isLoading,
    error,
    refetch: refetchOrganizations,
  } = useOrganizations();

  const [search, setSearch] = useState("");
  const [expandedFilter, setExpandedFilter] = useState<GraphFilterCategory | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const [activeOrgDetail, setActiveOrgDetail] = useState<OrganizationDetail | null>(null);

  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [detailError, setDetailError] = useState<string | null>(null);

  const [isCardVisible, setIsCardVisible] = useState(false);

  const detailAbortRef = useRef<AbortController | null>(null);

  const detailRequestIdRef = useRef(0);

  const graphRef = useRef<GraphCanvasRef | null>(null);

  const graphContainerRef = useRef<HTMLDivElement | null>(null);

  const popupCardRef = useRef<HTMLDivElement | null>(null);

  // ACTIVATE GRAPH
  const activateGraph = useCallback(() => {
    setShowFunctionalGraph(true);
  }, []);

  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId],
  );

  const availableTags = useMemo(() => {
    const byId = new Map<
      string,
      {
        id: string;
        name: string;
        count: number;
      }
    >();

    for (const org of organizations) {
      for (const tag of org.tags) {
        const existing = byId.get(tag.id);

        if (existing) {
          existing.count += 1;
        } else {
          byId.set(tag.id, {
            id: tag.id,
            name: tag.name,
            count: 1,
          });
        }
      }
    }

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [organizations]);

  useEffect(() => {
    setSelectedTagIds((previous) => {
      if (previous.size === 0) return previous;

      const validIds = new Set(availableTags.map((tag) => tag.id));

      let changed = false;

      const next = new Set<string>();

      for (const id of previous) {
        if (validIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }

      return changed ? next : previous;
    });
  }, [availableTags]);

  const filteredOrganizations = useMemo(() => {
    const query = search.trim().toLowerCase();

    const hasQuery = query.length > 0;
    const hasTagFilter = selectedTagIds.size > 0;

    if (!hasQuery && !hasTagFilter) {
      return organizations;
    }

    return organizations.filter((org) => {
      if (hasQuery && !org.name.toLowerCase().includes(query)) {
        return false;
      }

      if (hasTagFilter && !org.tags.some((tag) => selectedTagIds.has(tag.id))) {
        return false;
      }

      return true;
    });
  }, [organizations, search, selectedTagIds]);

  const toggleTag = useCallback(
    (tagId: string) => {
      activateGraph();

      setSelectedTagIds((previous) => {
        const next = new Set(previous);

        if (next.has(tagId)) {
          next.delete(tagId);
        } else {
          next.add(tagId);
        }

        return next;
      });
    },
    [activateGraph],
  );

  const clearTagFilter = useCallback(() => {
    setSelectedTagIds((previous) => (previous.size === 0 ? previous : new Set()));
  }, []);

  const handleFilterToggle = useCallback((category: GraphFilterCategory) => {
    if (category !== "Focus Area") return;
    setExpandedFilter((previous) => (previous === category ? null : category));
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

      if (detailRequestIdRef.current !== requestId) {
        return;
      }

      if (result.success) {
        setActiveOrgDetail(result.data);
        return;
      }

      setDetailError(result.error || "Unable to load organization details.");
    } catch (caughtError) {
      if (isAbortError(caughtError) || detailRequestIdRef.current !== requestId) {
        return;
      }

      setDetailError(getErrorMessage(caughtError, "Unable to load organization details."));
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

  const nodes = useMemo<GraphNode[]>(
    () =>
      filteredOrganizations.map((org) => ({
        id: org.id,
        label: org.name,
      })),
    [filteredOrganizations],
  );

  const edges = useMemo<GraphEdge[]>(() => {
    const visibleNodeIds = new Set(nodes.map((node) => node.id));

    return relationships
      .filter(
        (rel) =>
          rel.relationshipTier === "PRIMARY" &&
          visibleNodeIds.has(rel.npo1Id) &&
          visibleNodeIds.has(rel.npo2Id),
      )
      .map((rel) => ({
        id: rel.id,
        source: rel.npo1Id,
        target: rel.npo2Id,
        ...(rel.relationshipType ? { label: rel.relationshipType } : {}),
      }));
  }, [nodes, relationships]);

  const visibleNodeIdsKey = useMemo(
    () =>
      nodes
        .map((node) => node.id)
        .sort()
        .join("|"),
    [nodes],
  );

  const selections = useMemo<string[]>(
    () => (isCardVisible && selectedOrgId ? [selectedOrgId] : []),
    [isCardVisible, selectedOrgId],
  );

  // Left sidebar is `absolute left-4 w-[400px]`, so its right edge sits at 416px.
  // Round up slightly so content has breathing room from the sidebar.
  const SIDEBAR_RIGHT_PX = 420;

  const fitWithSidebarOffset = useCallback((nodeIds?: string[]) => {
    const ref = graphRef.current;
    if (!ref) return;

    ref.fitNodesInView(nodeIds, { animated: true });

    // After fit, compensate when the WebGL canvas extends behind the floating
    // sidebar so the visible center of the content sits to the right of it.
    const controls = ref.getControls() as unknown as {
      camera?: { fov?: number; position: { length: () => number } };
      distance?: number;
      truck: (x: number, y: number, enableTransition?: boolean) => void;
      dolly: (distance: number, enableTransition?: boolean) => void;
    } | null;
    const container = graphContainerRef.current;
    if (!controls || !container) return;

    const camera = controls.camera;
    if (!camera || typeof camera.fov !== "number") return;

    const rect = container.getBoundingClientRect();
    if (rect.height === 0) return;

    // If the container already starts at or past the sidebar's right edge, fit
    // is already centered in the visible area — no shift needed.
    const overlapPx = SIDEBAR_RIGHT_PX - rect.left;
    if (overlapPx <= 0) return;

    // Convert the half-overlap from CSS pixels to world units using the
    // perspective camera's visible height at the current target distance.
    const distance = controls.distance ?? camera.position.length();
    const fovRad = (camera.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(fovRad / 2) * distance;
    const worldPerPixel = visibleHeight / rect.height;
    const offsetWorld = (overlapPx / 2) * worldPerPixel;

    // Trucking the camera left shifts visible content rightward, clearing the
    // sidebar. Dolly out by the same magnitude so nothing falls off the right.
    controls.truck(-offsetWorld, 0, true);
    controls.dolly(-offsetWorld, true);
  }, []);

  useEffect(() => {
    if (visibleNodeIdsKey.length === 0 || !showFunctionalGraph) {
      return;
    }

    // Force-directed layout needs time to settle after nodes change; refit a few
    // times across the simulation window so the camera tracks it as it converges.
    const refitDelaysMs = [50, 350, 800, 1400];

    const timeoutIds = refitDelaysMs.map((delay) =>
      window.setTimeout(() => {
        fitWithSidebarOffset();
      }, delay),
    );

    return () => {
      for (const id of timeoutIds) {
        window.clearTimeout(id);
      }
    };
  }, [visibleNodeIdsKey, showFunctionalGraph, fitWithSidebarOffset]);

  const handleRetry = useCallback(() => {
    void refetchOrganizations();
  }, [refetchOrganizations]);

  const handleNodeClick = useCallback(
    (node: InternalGraphNode) => {
      activateGraph();

      if (selectedOrgId === node.id && isCardVisible) {
        detailAbortRef.current?.abort();
        setIsCardVisible(false);
        return;
      }

      setSelectedOrgId(node.id);
      setIsCardVisible(true);

      fitWithSidebarOffset([node.id]);

      void fetchOrganizationDetail(node.id);
    },
    [activateGraph, fetchOrganizationDetail, fitWithSidebarOffset, isCardVisible, selectedOrgId],
  );

  const handleCloseCard = useCallback(() => {
    detailAbortRef.current?.abort();
    setIsCardVisible(false);
  }, []);

  const handleRetryDetail = useCallback(() => {
    if (!selectedOrgId) return;

    void fetchOrganizationDetail(selectedOrgId);
  }, [fetchOrganizationDetail, selectedOrgId]);

  // Close the popup when the user clicks anywhere outside it.
  useEffect(() => {
    if (!isCardVisible) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && popupCardRef.current?.contains(target)) {
        return;
      }
      handleCloseCard();
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [handleCloseCard, isCardVisible]);

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

  const hasSearchQuery = search.trim().length > 0;

  const hasTagFilter = selectedTagIds.size > 0;

  const hasActiveFilters = hasSearchQuery || hasTagFilter;

  const hasOrganizations = organizations.length > 0;

  return (
    <div className="relative min-h-[calc(100vh-92px)] overflow-hidden rounded-3xl border border-slate-300 bg-slate-50">
      {/* LEFT SIDEBAR */}
      {!isLoading && !error && hasOrganizations && (
        <div className="pointer-events-none absolute left-4 top-4 z-10 w-[400px] max-w-[calc(100vw-2rem)]">
          <section className="pointer-events-auto flex h-[calc(100vh-120px)] flex-col overflow-y-auto rounded-[20px] border border-[#d4d7d6] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
            <div className="px-10 pb-6 pt-9">
              <h1 className="text-[20px] font-semibold leading-7 text-black">
                Welcome to the DBC Database
              </h1>
              <p className="mt-4 text-[14px] leading-[20px] text-black">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>

              <label className="mt-8 flex h-[44px] items-center rounded-full border border-[#b4b4b4] bg-white px-4">
                <span className="sr-only">Search organizations</span>
                <SearchIcon className="pointer-events-none h-5 w-5 flex-shrink-0 text-[#6c6c6c]" />
                <input
                  className="min-w-0 flex-1 bg-transparent pl-3 text-[14px] text-[#333] placeholder:text-[#6c6c6c] focus:outline-none"
                  placeholder="Search"
                  type="search"
                  value={search}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSearch(value);
                    if (value.trim().length > 0) {
                      activateGraph();
                    }
                  }}
                />
              </label>
            </div>

            <div className="flex flex-1 flex-col border-t border-[#d9d9d9] px-10 pb-9 pt-7">
              <div className="mb-4 flex min-h-5 items-center justify-between gap-2">
                <p className="text-[13px] leading-5 text-[#6c6c6c]">Filters</p>
                {selectedTagIds.size > 0 ? (
                  <button
                    type="button"
                    onClick={clearTagFilter}
                    className="text-[13px] font-semibold leading-5 text-[#3b9a9a] transition-colors hover:text-[#2f7f7f]"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <div className="flex flex-col gap-4">
                {FILTER_CATEGORIES.map((category) => {
                  const isExpanded = expandedFilter === category;
                  const isFocusArea = category === "Focus Area";

                  return (
                    <div key={category}>
                      <button
                        type="button"
                        aria-expanded={isFocusArea ? isExpanded : undefined}
                        onClick={() => handleFilterToggle(category)}
                        className="flex h-[44px] w-full items-center justify-between rounded-[8px] border border-[#b4b4b4] bg-white px-4 text-left text-[14px] font-medium leading-5 text-black transition-colors hover:border-[#8d8d8d] hover:bg-[#fbfbfb]"
                      >
                        <span className="truncate">
                          {category}
                          {isFocusArea && selectedTagIds.size > 0
                            ? ` (${selectedTagIds.size})`
                            : ""}
                        </span>
                        <ChevronRightIcon
                          className={`h-5 w-5 flex-shrink-0 text-black transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </button>

                      {isFocusArea && isExpanded ? (
                        <div className="mt-2 max-h-56 overflow-y-auto rounded-[8px] border border-[#d9d9d9] bg-white py-1">
                          {availableTags.length === 0 ? (
                            <p className="px-4 py-2.5 text-[13px] leading-5 text-[#6c6c6c]">
                              No focus areas available.
                            </p>
                          ) : (
                            availableTags.map((tag) => {
                              const isSelected = selectedTagIds.has(tag.id);
                              return (
                                <label
                                  key={tag.id}
                                  className={`flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-[13px] leading-5 transition-colors hover:bg-[#f5f5f5] ${
                                    isSelected ? "text-[#2f7f7f]" : "text-black"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 flex-shrink-0 accent-[#3b9a9a]"
                                    checked={isSelected}
                                    onChange={() => toggleTag(tag.id)}
                                  />
                                  <span className="min-w-0 flex-1 truncate" title={tag.name}>
                                    {tag.name}
                                  </span>
                                  <span className="flex-shrink-0 text-[#6c6c6c]">{tag.count}</span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* LOADING */}
      {isLoading ? (
        <div className="flex min-h-[calc(100vh-92px)] items-center justify-center p-6 text-sm text-slate-600">
          Loading organizations...
        </div>
      ) : error ? (
        <div className="flex min-h-[calc(100vh-92px)] flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-slate-700">{error}</p>

          <button
            type="button"
            onClick={handleRetry}
            className="rounded-[40px] bg-[#3b9a9a] px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      ) : !showFunctionalGraph ? (
        /* STATIC TREE LANDING PAGE */
        <div className="flex min-h-[calc(100vh-92px)] w-full items-center justify-center pl-[420px] pr-6">
          <button
            type="button"
            onClick={activateGraph}
            className="relative h-[80vh] w-full max-w-5xl transition-transform duration-300 hover:scale-[1.01]"
          >
            <Image
              src="/images/tree.svg"
              alt="Static organization tree"
              fill
              priority
              className="object-contain"
            />
          </button>
        </div>
      ) : nodes.length === 0 ? (
        <div className="flex min-h-[calc(100vh-92px)] items-center justify-center p-6 pl-[420px] text-sm text-slate-600">
          {hasActiveFilters
            ? "No organizations match the current filters."
            : "No organizations to display."}
        </div>
      ) : (
        /* FUNCTIONAL GRAPH */
        <div ref={graphContainerRef} className="h-[calc(100vh-92px)] w-full pl-[420px]">
          <GraphCanvas
            ref={graphRef}
            draggable
            layoutType="forceDirected2d"
            layoutOverrides={{ nodeStrength: -800, linkDistance: 180 }}
            labelType="nodes"
            edgeArrowPosition="none"
            nodes={nodes}
            edges={edges}
            selections={selections}
            onNodeClick={handleNodeClick}
          />
        </div>
      )}

      {/* PROFILE CARD */}
      <div
        className={`pointer-events-none fixed inset-0 z-20 flex items-center justify-end px-4 py-8 transition-opacity duration-200 md:px-8 lg:px-10 ${
          isCardVisible && selectedOrgId ? "opacity-100" : "opacity-0"
        }`}
      >
        {selectedOrgId ? (
          <div
            ref={popupCardRef}
            className="pointer-events-auto max-w-160 rounded-[30px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.1)] transition-transform duration-200"
            style={{
              transform: isCardVisible ? "translateY(0)" : "translateY(8px)",
            }}
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
                  ✕
                </button>

                <h1 className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[28px]/[normal] font-bold text-black sm:text-[32px]">
                  {selectedOrganization?.name ?? "Organization"}
                </h1>

                {isDetailLoading ? (
                  <p className="mt-3 text-sm text-[#484848]">Loading organization details...</p>
                ) : detailError ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm text-[#484848]">{detailError}</p>

                    <button
                      className="rounded-[40px] bg-[#3b9a9a] px-4 py-2 text-sm font-semibold text-white"
                      type="button"
                      onClick={handleRetryDetail}
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[#484848]">No organization details available.</p>
                )}
              </section>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

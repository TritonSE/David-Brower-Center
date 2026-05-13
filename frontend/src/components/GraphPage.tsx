"use client";

// NOTE: THIS IS A VIBE CODED PROTOTYPE FOR USER TESTING PURPOSES
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  FilterIcon,
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

import {
  getOrganizationById,
  getOrganizations,
  type OrganizationDetail,
  type OrganizationListItem,
} from "@/api/organization";

const GraphCanvas = dynamic<GraphCanvasProps>(async () => (await import("reagraph")).GraphCanvas, {
  ssr: false,
}) as unknown as React.ForwardRefExoticComponent<
  GraphCanvasProps & React.RefAttributes<GraphCanvasRef>
>;

type GraphNode = {
  id: string;
  label: string;
  fx?: number;
  fy?: number;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

const DUMMY_TREE_BRANCHING_FACTOR = 3;
const POPUP_FADE_DURATION_MS = 200;
const RADIUS_STEP = 140;
const TREE_FAN_MIN_ANGLE = Math.PI * 0.12;
const TREE_FAN_MAX_ANGLE = Math.PI * 0.88;
const ANGLE_JITTER_RATIO = 0.18;
const RADIUS_JITTER_RATIO = 0.08;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function buildDummyTreeEdges(nodes: GraphNode[]): GraphEdge[] {
  if (nodes.length < 2) return [];

  const edges: GraphEdge[] = [];
  const branchingFactor = Math.max(1, DUMMY_TREE_BRANCHING_FACTOR);

  for (let i = 1; i < nodes.length; i++) {
    const parentIndex = Math.floor((i - 1) / branchingFactor);

    const source = nodes[parentIndex];
    const target = nodes[i];

    edges.push({
      id: `${source.id}->${target.id}`,
      source: source.id,
      target: target.id,
      label: "Related",
    });
  }

  return edges;
}

function hashToUnitInterval(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) | 0;
  }

  return (hash >>> 0) / 0x100000000;
}

function computeTreePositions(
  nodes: GraphNode[],
  edges: GraphEdge[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  if (nodes.length === 0) return positions;

  const childrenByParent = new Map<string, string[]>();

  for (const edge of edges) {
    const list = childrenByParent.get(edge.source) ?? [];
    list.push(edge.target);
    childrenByParent.set(edge.source, list);
  }

  const rootId = nodes[0].id;

  positions.set(rootId, { x: 0, y: 0 });

  const leafCountById = new Map<string, number>();

  const computeLeafCount = (id: string): number => {
    const children = childrenByParent.get(id);

    if (!children || children.length === 0) {
      leafCountById.set(id, 1);
      return 1;
    }

    let total = 0;

    for (const childId of children) {
      total += computeLeafCount(childId);
    }

    leafCountById.set(id, total);

    return total;
  };

  computeLeafCount(rootId);

  const placeSubtree = (
    nodeId: string,
    depth: number,
    sliceStart: number,
    sliceEnd: number,
  ): void => {
    const children = childrenByParent.get(nodeId);

    if (!children || children.length === 0) return;

    const parentLeafCount = leafCountById.get(nodeId) ?? 1;
    const sliceWidth = sliceEnd - sliceStart;
    const childRadius = (depth + 1) * RADIUS_STEP;

    let cursor = sliceStart;

    for (const childId of children) {
      const childLeafCount = leafCountById.get(childId) ?? 1;

      const childSliceWidth = sliceWidth * (childLeafCount / parentLeafCount);

      const childSliceStart = cursor;
      const childSliceEnd = cursor + childSliceWidth;

      const childSliceCenter = (childSliceStart + childSliceEnd) / 2;

      const rand = hashToUnitInterval(childId);

      const angleJitter = (rand - 0.5) * 2 * ANGLE_JITTER_RATIO * childSliceWidth;

      const radiusJitter = 1 + (rand - 0.5) * 2 * RADIUS_JITTER_RATIO;

      const finalAngle = childSliceCenter + angleJitter;
      const finalRadius = childRadius * radiusJitter;

      positions.set(childId, {
        x: finalRadius * Math.cos(finalAngle),
        y: finalRadius * Math.sin(finalAngle),
      });

      placeSubtree(childId, depth + 1, childSliceStart, childSliceEnd);

      cursor = childSliceEnd;
    }
  };

  placeSubtree(rootId, 0, TREE_FAN_MIN_ANGLE, TREE_FAN_MAX_ANGLE);

  return positions;
}

function collectSubtreeIds(rootId: string, childrenByParent: Map<string, string[]>): Set<string> {
  const visited = new Set<string>();
  const stack: string[] = [rootId];

  while (stack.length > 0) {
    const current = stack.pop();

    if (current === undefined || visited.has(current)) continue;

    visited.add(current);

    const children = childrenByParent.get(current);

    if (children) stack.push(...children);
  }

  return visited;
}

export default function GraphPage() {
  // LANDING STATE
  const [showFunctionalGraph, setShowFunctionalGraph] = useState(false);

  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const [activeOrgDetail, setActiveOrgDetail] = useState<OrganizationDetail | null>(null);

  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [detailError, setDetailError] = useState<string | null>(null);

  const [isCardVisible, setIsCardVisible] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const listRequestIdRef = useRef(0);

  const detailAbortRef = useRef<AbortController | null>(null);

  const detailRequestIdRef = useRef(0);

  const graphRef = useRef<GraphCanvasRef | null>(null);

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

  const fetchOrganizations = useCallback(async () => {
    abortRef.current?.abort();

    const abortController = new AbortController();

    abortRef.current = abortController;

    const requestId = listRequestIdRef.current + 1;

    listRequestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    try {
      const result: APIResult<OrganizationListItem[]> = await getOrganizations(
        abortController.signal,
      );

      if (abortRef.current !== abortController || listRequestIdRef.current !== requestId) {
        return;
      }

      if (result.success) {
        setOrganizations(result.data);
        return;
      }

      setOrganizations([]);

      setError(result.error || "Unable to load organizations.");
    } catch (caughtError) {
      if (
        isAbortError(caughtError) ||
        abortRef.current !== abortController ||
        listRequestIdRef.current !== requestId
      ) {
        return;
      }

      setOrganizations([]);

      setError(getErrorMessage(caughtError, "Unable to load organizations."));
    } finally {
      if (abortRef.current === abortController && listRequestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchOrganizations();

    return () => abortRef.current?.abort();
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

  const { baseNodes, edges, childrenByParent } = useMemo(() => {
    const nextBaseNodes: GraphNode[] = filteredOrganizations.map((org) => ({
      id: org.id,
      label: org.name,
    }));

    const nextEdges = buildDummyTreeEdges(nextBaseNodes);

    const nextChildrenByParent = new Map<string, string[]>();

    for (const edge of nextEdges) {
      const list = nextChildrenByParent.get(edge.source) ?? [];

      list.push(edge.target);

      nextChildrenByParent.set(edge.source, list);
    }

    return {
      baseNodes: nextBaseNodes,
      edges: nextEdges,
      childrenByParent: nextChildrenByParent,
    };
  }, [filteredOrganizations]);

  useEffect(() => {
    setPositions(computeTreePositions(baseNodes, edges));
  }, [baseNodes, edges]);

  const nodes = useMemo<GraphNode[]>(
    () =>
      baseNodes.map((node) => {
        const position = positions.get(node.id);

        if (!position) return node;

        return {
          ...node,
          fx: position.x,
          fy: position.y,
        };
      }),
    [baseNodes, positions],
  );

  const visibleNodeIdsKey = useMemo(
    () =>
      baseNodes
        .map((node) => node.id)
        .sort()
        .join("|"),
    [baseNodes],
  );

  useEffect(() => {
    if (visibleNodeIdsKey.length === 0 || !showFunctionalGraph) {
      return;
    }

    let cancelled = false;

    const rafId = requestAnimationFrame(() => {
      if (cancelled) return;

      graphRef.current?.fitNodesInView(undefined, {
        animated: true,
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [visibleNodeIdsKey, showFunctionalGraph]);

  const handleNodeDragged = useCallback(
    (node: InternalGraphNode) => {
      setPositions((previousPositions) => {
        const previous = previousPositions.get(node.id);

        if (!previous) return previousPositions;

        const deltaX = node.position.x - previous.x;

        const deltaY = node.position.y - previous.y;

        if (deltaX === 0 && deltaY === 0) {
          return previousPositions;
        }

        const subtreeIds = collectSubtreeIds(node.id, childrenByParent);

        const nextPositions = new Map(previousPositions);

        for (const id of subtreeIds) {
          const current = nextPositions.get(id);

          if (!current) continue;

          nextPositions.set(id, {
            x: current.x + deltaX,
            y: current.y + deltaY,
          });
        }

        return nextPositions;
      });
    },
    [childrenByParent],
  );

  const handleRetry = useCallback(() => {
    void fetchOrganizations();
  }, [fetchOrganizations]);

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

      void fetchOrganizationDetail(node.id);
    },
    [activateGraph, fetchOrganizationDetail, isCardVisible, selectedOrgId],
  );

  const handleCloseCard = useCallback(() => {
    detailAbortRef.current?.abort();
    setIsCardVisible(false);
  }, []);

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

  const hasSearchQuery = search.trim().length > 0;

  const hasTagFilter = selectedTagIds.size > 0;

  const hasActiveFilters = hasSearchQuery || hasTagFilter;

  const hasOrganizations = organizations.length > 0;

  return (
    <div className="relative min-h-[calc(100vh-92px)] overflow-hidden rounded-3xl border border-slate-300 bg-slate-50">
      {/* LEFT SIDEBAR */}
      {!isLoading && !error && hasOrganizations && (
        <div className="pointer-events-none absolute bottom-4 left-4 top-4 z-10 flex w-[280px] max-w-[calc(100vw-2rem)] flex-col gap-3">
          {/* SEARCH */}
          <div className="pointer-events-auto relative flex items-center rounded-[100px] border border-[#b4b4b4] bg-white px-5 py-[10px] shadow-sm">
            <SearchIcon className="pointer-events-none absolute left-5 h-4.5 w-4.5 text-[#6c6c6c]" />

            <input
              className="w-full pl-8 text-sm text-[#6c6c6c] placeholder:text-[#6c6c6c] focus:outline-none"
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
          </div>

          {/* FILTERS */}
          <div className="pointer-events-auto flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-[#b4b4b4] bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-[#e5e5e5] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#333]">
                <FilterIcon className="h-4 w-4 text-[#6c6c6c]" />

                <span>Filter by tag</span>

                {selectedTagIds.size > 0 ? (
                  <span className="rounded-full bg-[#3b9a9a] px-2 py-0.5 text-xs font-semibold text-white">
                    {selectedTagIds.size}
                  </span>
                ) : null}
              </div>

              {selectedTagIds.size > 0 ? (
                <button
                  type="button"
                  onClick={clearTagFilter}
                  className="text-xs font-semibold text-[#3b9a9a] transition-colors hover:text-[#2f7f7f]"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {availableTags.length === 0 ? (
              <p className="px-4 py-3 text-xs text-[#6c6c6c]">
                No tags are associated with the loaded organizations.
              </p>
            ) : (
              <ul className="flex-1 overflow-y-auto py-1">
                {availableTags.map((tag) => {
                  const isSelected = selectedTagIds.has(tag.id);

                  return (
                    <li key={tag.id}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-[#f5f5f5] ${
                          isSelected ? "bg-[#f0f8f8] text-[#2f7f7f]" : "text-[#333]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 flex-shrink-0 accent-[#3b9a9a]"
                          checked={isSelected}
                          onChange={() => toggleTag(tag.id)}
                        />

                        <span className="flex-1 truncate" title={tag.name}>
                          {tag.name}
                        </span>

                        <span className="flex-shrink-0 text-xs text-[#6c6c6c]">{tag.count}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
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
        <div className="flex min-h-[calc(100vh-92px)] w-full items-center justify-center pl-[280px] pr-6">
          <button
            type="button"
            onClick={activateGraph}
            className="relative h-[80vh] w-full max-w-5xl transition-transform duration-300 hover:scale-[1.01]"
          >
            <Image
              src="/images/static-tree.png"
              alt="Static organization tree"
              fill
              priority
              className="object-contain"
            />
          </button>
        </div>
      ) : nodes.length === 0 ? (
        <div className="flex min-h-[calc(100vh-92px)] items-center justify-center p-6 pl-[280px] text-sm text-slate-600">
          {hasActiveFilters
            ? "No organizations match the current filters."
            : "No organizations to display."}
        </div>
      ) : (
        /* FUNCTIONAL GRAPH */
        <div className="h-[calc(100vh-92px)] w-full pl-[280px]">
          <GraphCanvas
            ref={graphRef}
            draggable
            layoutType="forceDirected2d"
            edgeArrowPosition="none"
            nodes={nodes}
            edges={edges}
            onNodeDragged={handleNodeDragged}
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

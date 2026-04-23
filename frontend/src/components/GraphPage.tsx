"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LeafIcon, LocationIcon, MoneyIcon, PeopleIcon, SearchIcon } from "./icons/AppIcons";
import NpoProfileCard from "./NpoProfileCard";

import type React from "react";
import type { GraphCanvasProps, GraphCanvasRef, InternalGraphNode } from "reagraph";

import {
  getOrganizationById,
  getOrganizations,
  type OrganizationDetail,
  type OrganizationListItem,
} from "@/api/organization";

// Reagraph depends on WebGL/Three.js, so it must only render on the client.
// Using `dynamic` with `ssr: false` prevents Next.js from attempting to
// render the canvas during server-side rendering.
// We re-assert the ref-forwarding type because `next/dynamic`'s public
// types drop the ref signature, even though Next preserves refs at
// runtime. Without this cast, passing `ref` to <GraphCanvas /> would
// fail to type-check.
const GraphCanvas = dynamic<GraphCanvasProps>(async () => (await import("reagraph")).GraphCanvas, {
  ssr: false,
}) as unknown as React.ForwardRefExoticComponent<
  GraphCanvasProps & React.RefAttributes<GraphCanvasRef>
>;

// Node/edge shapes accepted by reagraph. `fx`/`fy` pin a node's position in
// the force-directed layout so we can compute a custom tree silhouette.
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

// Branching factor for the dummy tree — how many children each parent has.
// 3 produces a full, bushy crown without getting too wide.
const DUMMY_TREE_BRANCHING_FACTOR = 3;

// Matches the fade duration of the overlay card so we can fully tear down
// the associated detail state after the exit animation finishes.
const POPUP_FADE_DURATION_MS = 200;

// Parameters that shape the rendered tree silhouette. Tuned for readability
// at reagraph's default camera distance; adjust if the graph feels cramped
// or overly spread out.
const RADIUS_STEP = 140; // Radial distance between consecutive tree depths.
const TREE_FAN_MIN_ANGLE = Math.PI * 0.12; // ~22°; lower bound of the root fan.
const TREE_FAN_MAX_ANGLE = Math.PI * 0.88; // ~158°; upper bound (fan points upward).
const ANGLE_JITTER_RATIO = 0.18; // Jitter as a fraction of each node's own slice.
const RADIUS_JITTER_RATIO = 0.08; // ±8% deterministic variation in radius per node.

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

// Builds deterministic, client-only edges that form a balanced tree between
// organizations. The backend does not yet model relationships between orgs,
// so we synthesize a tree topology where the first node is the root and each
// subsequent node is assigned to a parent based on its index. This produces
// the parent/child structure we use to lay out a natural-looking tree.
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

// Deterministic hash of a string to a value in [0, 1). Used to seed per-node
// jitter so the tree looks organic but renders identically every time.
function hashToUnitInterval(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) | 0;
  }
  return (hash >>> 0) / 0x100000000;
}

// Computes (x, y) positions for each node such that the graph resembles a
// natural tree: the root sits at the base and branches fan upward, with
// each subtree confined to its own angular slice so sibling subtrees can
// never overlap at any depth. Positions are written onto a Map keyed by id.
function computeTreePositions(
  nodes: GraphNode[],
  edges: GraphEdge[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return positions;

  // Build a parent -> children adjacency list from the dummy tree edges.
  // Edge order is preserved so siblings render left-to-right consistently.
  const childrenByParent = new Map<string, string[]>();
  for (const edge of edges) {
    const list = childrenByParent.get(edge.source) ?? [];
    list.push(edge.target);
    childrenByParent.set(edge.source, list);
  }

  // The first node is treated as the trunk's base. It sits at the origin;
  // its children will fan outward along the range [TREE_FAN_MIN_ANGLE,
  // TREE_FAN_MAX_ANGLE] in standard math angle convention (0 = right,
  // PI / 2 = up), so the tree opens upward from the base.
  const rootId = nodes[0].id;
  positions.set(rootId, { x: 0, y: 0 });

  // Post-order traversal: compute each subtree's total leaf count. The
  // leaf count determines how much angular territory that subtree needs
  // — more leaves means a wider angular slice, which prevents cramping.
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

  // Pre-order placement. Each node is assigned an angular slice by its
  // parent; the node places itself at the slice's center (plus jitter),
  // then recursively subdivides the slice among its own children
  // proportionally to their leaf counts.
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

      // Deterministic per-node jitter for organic asymmetry. Angle jitter
      // is scaled to a fraction of the child's own slice so it can never
      // push the node into a sibling's territory.
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

// Collects the given node id plus every descendant in the parent -> children
// adjacency map. Used so that dragging a node translates its whole subtree
// (i.e. the "branch" hanging off that node) as a single unit.
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
  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // Positions are mutable at runtime so that dragging a node can translate
  // it and all of its descendants together. Keyed by node id.
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  // Detail-panel state: mirrors the list view so clicking a node opens the
  // same NpoProfileCard overlay with the selected organization's info.
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [activeOrgDetail, setActiveOrgDetail] = useState<OrganizationDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isCardVisible, setIsCardVisible] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const detailAbortRef = useRef<AbortController | null>(null);
  // Monotonically increasing id used to ignore stale detail responses when
  // the user clicks through several nodes quickly.
  const detailRequestIdRef = useRef(0);
  // Imperative handle to the reagraph canvas. Used to re-fit the camera on
  // the currently rendered nodes whenever the search filter changes the
  // visible set (or on initial load).
  const graphRef = useRef<GraphCanvasRef | null>(null);

  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId],
  );

  // Case-insensitive, substring match on organization name — matches the
  // list view's search behavior so the two surfaces feel consistent.
  const filteredOrganizations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length === 0) return organizations;
    return organizations.filter((org) => org.name.toLowerCase().includes(query));
  }, [organizations, search]);

  const fetchOrganizations = useCallback(async () => {
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      const fetched = await getOrganizations(abortController.signal);
      if (abortRef.current !== abortController) return;
      setOrganizations(fetched);
    } catch (caughtError) {
      if (isAbortError(caughtError) || abortRef.current !== abortController) return;
      setOrganizations([]);
      setError(getErrorMessage(caughtError, "Unable to load organizations."));
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
    } catch (caughtError) {
      if (isAbortError(caughtError) || detailRequestIdRef.current !== requestId) return;
      setDetailError(getErrorMessage(caughtError, "Unable to load organization details."));
    } finally {
      if (detailRequestIdRef.current === requestId) {
        setIsDetailLoading(false);
      }
    }
  }, []);

  useEffect(() => () => detailAbortRef.current?.abort(), []);

  // After the overlay finishes fading out, fully clear the selection so we
  // don't keep stale data around (and a future selection starts fresh).
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

  // Derive the graph's structural data (base nodes, edges, and a
  // parent -> children adjacency map) from the organization list.
  // `childrenByParent` is used both for the initial layout and for
  // subtree drag handling.
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

  // Reset positions whenever the underlying organization list changes.
  // This throws away any drag translations the user applied, which is
  // the correct behavior since the tree structure itself has changed.
  useEffect(() => {
    setPositions(computeTreePositions(baseNodes, edges));
  }, [baseNodes, edges]);

  // Produce the final node list for reagraph by pinning each node's
  // position via `fx` / `fy`. Reagraph will respect these fixed positions
  // as long as we're using a force-directed layout.
  const nodes = useMemo<GraphNode[]>(
    () =>
      baseNodes.map((node) => {
        const position = positions.get(node.id);
        if (!position) return node;
        return { ...node, fx: position.x, fy: position.y };
      }),
    [baseNodes, positions],
  );

  // Stable key that changes only when the *set* of rendered node ids
  // changes (e.g. because search filtered the list). We use this to
  // re-fit the camera without re-firing the effect on unrelated
  // re-renders like drag updates.
  const visibleNodeIdsKey = useMemo(
    () =>
      baseNodes
        .map((node) => node.id)
        .sort()
        .join("|"),
    [baseNodes],
  );

  // Whenever the visible node set changes, fit the camera to the current
  // nodes so the graph stays centered on screen. We defer to
  // requestAnimationFrame so reagraph has a chance to apply the new
  // layout positions before we ask it to fit them.
  useEffect(() => {
    if (visibleNodeIdsKey.length === 0) return;
    let cancelled = false;
    const rafId = requestAnimationFrame(() => {
      if (cancelled) return;
      graphRef.current?.fitNodesInView(undefined, { animated: true });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [visibleNodeIdsKey]);

  // Drag handler: translate the dragged node AND every descendant by the
  // same delta so an entire branch of the tree moves as a unit.
  const handleNodeDragged = useCallback(
    (node: InternalGraphNode) => {
      setPositions((previousPositions) => {
        const previous = previousPositions.get(node.id);
        if (!previous) return previousPositions;

        const deltaX = node.position.x - previous.x;
        const deltaY = node.position.y - previous.y;
        if (deltaX === 0 && deltaY === 0) return previousPositions;

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

  // Clicking the same node again toggles the overlay closed, matching the
  // list view's behavior where re-clicking the active row collapses it.
  const handleNodeClick = useCallback(
    (node: InternalGraphNode) => {
      if (selectedOrgId === node.id && isCardVisible) {
        detailAbortRef.current?.abort();
        setIsCardVisible(false);
        return;
      }

      setSelectedOrgId(node.id);
      setIsCardVisible(true);
      void fetchOrganizationDetail(node.id);
    },
    [fetchOrganizationDetail, isCardVisible, selectedOrgId],
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

  // Distinguish "no data at all" from "search returned nothing" so the
  // empty state can explain why the graph is blank.
  const hasSearchQuery = search.trim().length > 0;
  const hasOrganizations = organizations.length > 0;

  return (
    <div className="relative min-h-[calc(100vh-92px)] overflow-hidden rounded-3xl border border-slate-300 bg-slate-50">
      {!isLoading && !error && hasOrganizations && (
        // Floating search control layered over the canvas. Uses the same
        // styling as the list view's search input so both views feel
        // consistent. `z-10` keeps it above the reagraph WebGL canvas.
        <div className="pointer-events-none absolute left-4 top-4 z-10">
          <div className="pointer-events-auto relative flex w-[320px] max-w-[calc(100vw-2rem)] items-center rounded-[100px] border border-[#b4b4b4] bg-white px-5 py-[10px] shadow-sm">
            <SearchIcon className="pointer-events-none absolute left-5 h-4.5 w-4.5 text-[#6c6c6c]" />
            <input
              className="w-full pl-8 text-sm text-[#6c6c6c] placeholder:text-[#6c6c6c] focus:outline-none"
              placeholder="Search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-full min-h-[calc(100vh-92px)] items-center justify-center p-6 text-sm text-slate-600">
          Loading organizations...
        </div>
      ) : error ? (
        <div className="flex h-full min-h-[calc(100vh-92px)] flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-slate-700">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-[40px] bg-[#3b9a9a] px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      ) : nodes.length === 0 ? (
        <div className="flex h-full min-h-[calc(100vh-92px)] items-center justify-center p-6 text-sm text-slate-600">
          {hasSearchQuery ? "No organizations match your search." : "No organizations to display."}
        </div>
      ) : (
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
      )}

      {/* Overlay card that fades in/out and sits above the canvas. Mirrors
          the list view's profile card so the two surfaces behave the same. */}
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
                  {selectedOrganization?.name ?? "Organization"}
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

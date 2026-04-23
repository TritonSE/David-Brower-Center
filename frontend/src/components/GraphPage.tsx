"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import type { GraphCanvasProps } from "reagraph";

// Reagraph depends on WebGL/Three.js, so it must only render on the client.
// Using `dynamic` with `ssr: false` prevents Next.js from attempting to
// render the canvas during server-side rendering.
const GraphCanvas = dynamic<GraphCanvasProps>(async () => (await import("reagraph")).GraphCanvas, {
  ssr: false,
});

export default function GraphPage() {
  // Placeholder dataset. This is a minimal template intended to be replaced
  // with real organization data in a future iteration.
  const nodes = useMemo(
    () => [
      { id: "1", label: "Organization A" },
      { id: "2", label: "Organization B" },
      { id: "3", label: "Organization C" },
      { id: "4", label: "Organization D" },
    ],
    [],
  );

  const edges = useMemo(
    () => [
      { id: "1-2", source: "1", target: "2", label: "Related" },
      { id: "1-3", source: "1", target: "3", label: "Related" },
      { id: "2-4", source: "2", target: "4", label: "Related" },
    ],
    [],
  );

  return (
    <div className="relative min-h-[calc(100vh-92px)] overflow-hidden rounded-3xl border border-slate-300 bg-slate-50">
      <GraphCanvas nodes={nodes} edges={edges} />
    </div>
  );
}

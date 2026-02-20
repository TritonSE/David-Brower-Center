"use client";

import { useMemo, useState } from "react";

export type NavbarView = "graph" | "list" | "admin";

type NavbarProps = {
  isAdmin?: boolean;
  defaultView?: NavbarView;
  onViewChange?: (view: NavbarView) => void;
  className?: string;
};

export default function Navbar({
  isAdmin = false,
  defaultView = "graph",
  onViewChange,
  className,
}: NavbarProps) {
  const resolvedDefaultView = useMemo<NavbarView>(() => {
    if (defaultView === "admin" && !isAdmin) {
      return "graph";
    }

    return defaultView;
  }, [defaultView, isAdmin]);

  const [activeView, setActiveView] = useState<NavbarView>(resolvedDefaultView);

  const views: NavbarView[] = isAdmin ? ["graph", "list", "admin"] : ["graph", "list"];

  const handleSelect = (view: NavbarView) => {
    setActiveView(view);
    onViewChange?.(view);
  };

  return (
    <nav className={className} aria-label="View navigation">
      <div className="inline-flex h-12 items-center rounded-full border border-slate-300 bg-slate-200 p-1">
        {views.map((view) => {
          const isActive = activeView === view;

          return (
            <button
              key={view}
              type="button"
              onClick={() => handleSelect(view)}
              className={`min-w-[72px] rounded-full px-6 py-2 text-base font-medium transition-colors ${
                isActive
                  ? "bg-teal-600 text-white"
                  : "text-slate-500 hover:bg-slate-300 hover:text-slate-700"
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

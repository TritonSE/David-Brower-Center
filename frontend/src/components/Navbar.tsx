"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavbarView = "graph" | "list" | "manage" | "admin";

const viewRoutes: Record<NavbarView, string> = {
  graph: "/",
  list: "/list",
  manage: "/manage",
  admin: "/profile",
};

type NavbarProps = {
  isSignedIn?: boolean;
  onViewChange?: (view: NavbarView) => void;
  className?: string;
};

export default function Navbar({ isSignedIn = false, onViewChange, className }: NavbarProps) {
  const pathname = usePathname();
  const activeView =
    (Object.entries(viewRoutes) as [NavbarView, string][]).find(
      ([, route]) => route === pathname,
    )?.[0] ?? "graph";

  const views: NavbarView[] = isSignedIn ? ["graph", "list", "manage", "admin"] : ["graph", "list"];

  return (
    <nav className={className} aria-label="View navigation">
      <div className="inline-flex h-12 items-center rounded-full border border-slate-300 bg-slate-200 p-1">
        {views.map((view) => {
          const isActive = activeView === view;
          const href = viewRoutes[view];

          return (
            <Link
              key={view}
              href={href}
              onClick={() => onViewChange?.(view)}
              className={`min-w-[72px] rounded-full px-6 py-2 text-center text-base font-medium transition-colors ${
                isActive
                  ? "bg-teal-600 text-white"
                  : "text-slate-500 hover:bg-slate-300 hover:text-slate-700"
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

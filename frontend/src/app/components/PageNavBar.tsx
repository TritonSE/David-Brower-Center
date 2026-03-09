"use client";

import Link from "next/link";

type NavTab = "graph" | "list" | "manage";

type PageNavBarProps = {
  activeTab: NavTab;
};

function tabClassName(active: boolean) {
  if (active) {
    return "rounded-[40px] bg-[#3b9a9a] px-6 py-2 text-sm font-semibold text-white";
  }

  return "rounded-[40px] px-6 py-2 text-sm font-semibold text-[#6c6c6c] hover:text-[#3b9a9a]";
}

export default function PageNavBar({ activeTab }: PageNavBarProps) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-[30px] border border-[#d9d9d9] bg-white p-2 shadow-sm">
          <Link href="/" className={tabClassName(activeTab === "graph")}>
            Graph
          </Link>
          <Link href="/" className={tabClassName(activeTab === "list")}>
            List
          </Link>
          <Link href="/manage" className={tabClassName(activeTab === "manage")}>
            Manage
          </Link>
        </div>
      </div>

      <button
        className="rounded-[40px] border border-[#b4b4b4] bg-white px-6 py-2 text-sm font-semibold text-[#3b9a9a] shadow-sm"
        type="button"
      >
        Sign In
      </button>
    </header>
  );
}

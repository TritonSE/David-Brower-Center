import Navbar from "./Navbar";

import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
  isAdmin?: boolean;
};

export default function Layout({ children, isAdmin = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100 p-5">
      <header className="flex items-center justify-between gap-4">
        <Navbar isAdmin={isAdmin} />
        <button
          type="button"
          className="h-12 rounded-full border border-slate-300 bg-slate-100 px-8 text-lg font-medium text-teal-600"
        >
          Sign In
        </button>
      </header>
      <main className="pt-4">{children}</main>
    </div>
  );
}

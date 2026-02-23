"use client";

import FilteringMenu from "../components/filteringmenu/FilteringMenu";

export default function FilterTestPage() {
  return (
    <div className="min-h-screen p-10 bg-gray-100">
      <div className="flex justify-end">
        <FilteringMenu />
      </div>

      <div className="mt-10 bg-white p-10 rounded-xl shadow">Placeholder content</div>
    </div>
  );
}

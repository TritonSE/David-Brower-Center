"use client";

import { useState } from "react";

import AddNpoPopup from "../components/AddNpoPopup";

export default function Home() {
  const [isAddNpoOpen, setIsAddNpoOpen] = useState(false);

  return (
    <div className="min-h-[calc(100vh-92px)] rounded-3xl border border-slate-300 bg-slate-50 p-6">
      <button
        type="button"
        onClick={() => setIsAddNpoOpen(true)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Add NPO (test)
      </button>

      <AddNpoPopup
        open={isAddNpoOpen}
        onClose={() => setIsAddNpoOpen(false)}
        onNext={(values) => {
          console.log("Add NPO next:", values);
          setIsAddNpoOpen(false);
        }}
        onSaveDraft={(values) => {
          console.log("Add NPO save draft:", values);
          setIsAddNpoOpen(false);
        }}
      />
    </div>
  );
}

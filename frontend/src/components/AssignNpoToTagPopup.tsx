"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./AssignNpoToTagPopup.module.css";
import { SearchIcon } from "./icons/AppIcons";

import { useOrganizations } from "@/contexts/OrganizationsContext";

type AssignNpoToTagPopupProps = {
  open: boolean;
  tagId: string;
  onClose: () => void;
  onAssign?: (tagId: string, organizationIds: string[]) => void;
};

export default function AssignNpoToTagPopup({
  open,
  tagId,
  onClose,
  onAssign,
}: AssignNpoToTagPopupProps) {
  const { organizations, isLoading, error: loadError } = useOrganizations();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelectedIds([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const filteredOrgs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return organizations;
    return organizations.filter((org) => org.name.toLowerCase().includes(query));
  }, [organizations, search]);

  function handleToggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleOverlayMouseDown(e: React.MouseEvent) {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  function handleSave() {
    onAssign?.(tagId, selectedIds);
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.1)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        ref={wrapperRef}
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: 12,
          padding: 40,
          width: "min(825px, 100%)",
          height: "min(626px, 90vh)",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          boxShadow: "0px 2px 5px rgba(0,0,0,0.1)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-npo-title"
      >
        <header className={styles.header}>
          <h2 id="assign-npo-title" className={styles.title}>
            Assign NPO to Tag
          </h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 6L6 18M18 18L6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </header>

        <div className={styles.searchRow}>
          <label className={styles.searchLabel}>
            <span className="sr-only">Search NPOs</span>
            <span className={styles.searchIcon}>
              <SearchIcon className="h-[18px] w-[18px] text-[#6c6c6c]" />
            </span>
            <input
              type="search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </label>
          <button type="button" className={styles.filterButton} aria-label="Open filters">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M15.3333 7.66629H5.53834M2.08097 7.66629H0.666626M2.08097 7.66629C2.08097 7.20572 2.26306 6.76402 2.58717 6.43836C2.91129 6.11269 3.35089 5.92973 3.80926 5.92973C4.26763 5.92973 4.70722 6.11269 5.03134 6.43836C5.35546 6.76402 5.53754 7.20572 5.53754 7.66629C5.53754 8.12685 5.35546 8.56855 5.03134 8.89422C4.70722 9.21989 4.26763 9.40285 3.80926 9.40285C3.35089 9.40285 2.91129 9.21989 2.58717 8.89422C2.26306 8.56855 2.08097 8.12685 2.08097 7.66629ZM15.3333 12.9293H10.7763M10.7763 12.9293C10.7763 13.39 10.5938 13.8322 10.2696 14.1579C9.94541 14.4837 9.50571 14.6667 9.04724 14.6667C8.58887 14.6667 8.14927 14.4829 7.82515 14.1573C7.50104 13.8316 7.31895 13.3899 7.31895 12.9293M10.7763 12.9293C10.7763 12.4687 10.5938 12.0273 10.2696 11.7015C9.94541 11.3758 9.50571 11.1928 9.04724 11.1928C8.58887 11.1928 8.14927 11.3757 7.82515 11.7014C7.50104 12.0271 7.31895 12.4688 7.31895 12.9293M7.31895 12.9293H0.666626M15.3333 2.40324H12.8717M9.4143 2.40324H0.666626M9.4143 2.40324C9.4143 1.94268 9.59639 1.50098 9.92051 1.17531C10.2446 0.849645 10.6842 0.666687 11.1426 0.666687C11.3696 0.666687 11.5943 0.711604 11.804 0.798875C12.0137 0.886145 12.2042 1.01406 12.3647 1.17531C12.5252 1.33657 12.6525 1.528 12.7393 1.73869C12.8262 1.94938 12.8709 2.1752 12.8709 2.40324C12.8709 2.63129 12.8262 2.85711 12.7393 3.0678C12.6525 3.27849 12.5252 3.46992 12.3647 3.63118C12.2042 3.79243 12.0137 3.92034 11.804 4.00761C11.5943 4.09488 11.3696 4.1398 11.1426 4.1398C10.6842 4.1398 10.2446 3.95684 9.92051 3.63118C9.59639 3.30551 9.4143 2.86381 9.4143 2.40324Z"
                stroke="#4F4F4F"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.listContainer}>
          {isLoading ? (
            <p className={styles.statusMessage}>Loading organizations...</p>
          ) : loadError ? (
            <p className={styles.statusMessage}>{loadError}</p>
          ) : filteredOrgs.length === 0 ? (
            <p className={styles.emptyState}>
              {search.trim() ? "No organizations match your search." : "No organizations found."}
            </p>
          ) : (
            filteredOrgs.map((org) => {
              const isSelected = selectedIds.includes(org.id);
              return (
                <button
                  key={org.id}
                  type="button"
                  className={styles.row}
                  onClick={() => handleToggle(org.id)}
                  aria-pressed={isSelected}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(org.id)}
                    onClick={(e) => e.stopPropagation()}
                    className={styles.checkbox}
                    aria-label={`Select ${org.name}`}
                    tabIndex={-1}
                  />
                  <span>{org.name}</span>
                </button>
              );
            })
          )}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={selectedIds.length === 0}
          >
            Save
          </button>
        </footer>
      </div>
    </div>
  );
}

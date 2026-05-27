"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./AssignNpoToTagPopup.module.css";
import { SearchIcon } from "./icons/AppIcons";

import { useOrganizations } from "@/contexts/OrganizationsContext";

type AssignNpoToTagPopupProps = {
  open: boolean;
  tagId: string;
  tagName?: string;
  onClose: () => void;
  onAssign?: (tagId: string, organizationIds: string[]) => void;
};

export default function AssignNpoToTagPopup({
  open,
  tagId,
  tagName,
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

  function handleAssign() {
    onAssign?.(tagId, selectedIds);
  }

  if (!open) return null;

  const title = tagName ? `Assign NPOs to "${tagName}"` : "Assign NPOs to Tag";

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div
        ref={wrapperRef}
        className={styles.wrapper}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-npo-title"
      >
        <header className={styles.header}>
          <h2 id="assign-npo-title" className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            aria-label="Close"
          >
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
            <>
              <div className={styles.columnHeader}>
                <span />
                <span>Name</span>
                <span>Focus</span>
              </div>
              {filteredOrgs.map((org) => {
                const isSelected = selectedIds.includes(org.id);
                return (
                  <button
                    key={org.id}
                    type="button"
                    className={`${styles.row} ${isSelected ? styles.rowSelected : ""}`}
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
                    <span>{org.focus}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <span className={styles.selectedCount}>{selectedIds.length} selected</span>
          <button
            type="button"
            className={styles.assignButton}
            onClick={handleAssign}
            disabled={selectedIds.length === 0}
          >
            Assign
          </button>
        </footer>
      </div>
    </div>
  );
}

"use client";

import { type RefObject, useEffect, useId, useMemo, useRef, useState } from "react";

import { FilterIcon, SearchIcon } from "../icons/AppIcons";

import styles from "./AssignOrganizationsDialog.module.css";

import type { AssignedOrganization } from "./types";

type AssignOrganizationsDialogProps = {
  assignedOrganizations: AssignedOrganization[];
  availableOrganizations: AssignedOrganization[];
  open: boolean;
  onClose: () => void;
  onSave: (organizations: AssignedOrganization[]) => void;
  restoreFocusRef?: RefObject<HTMLElement | null>;
  tagName: string;
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatWebsiteLabel(website: string | null): string {
  if (!website) return "Website unavailable";
  return website.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function mergeOrganizations(
  availableOrganizations: AssignedOrganization[],
  assignedOrganizations: AssignedOrganization[],
): AssignedOrganization[] {
  const merged = new Map<string, AssignedOrganization>();

  for (const organization of availableOrganizations) {
    merged.set(organization.id, organization);
  }

  for (const organization of assignedOrganizations) {
    if (!merged.has(organization.id)) {
      merged.set(organization.id, organization);
      continue;
    }

    const current = merged.get(organization.id);
    if (!current) continue;

    merged.set(organization.id, {
      ...current,
      website: current.website ?? organization.website,
    });
  }

  return [...merged.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export default function AssignOrganizationsDialog({
  assignedOrganizations,
  availableOrganizations,
  open,
  onClose,
  onSave,
  restoreFocusRef,
  tagName,
}: AssignOrganizationsDialogProps) {
  const searchId = useId();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const options = useMemo(
    () => mergeOrganizations(availableOrganizations, assignedOrganizations),
    [assignedOrganizations, availableOrganizations],
  );

  useEffect(() => {
    if (!open) return;
    setSearchQuery("");
    setSelectedIds(assignedOrganizations.map((organization) => organization.id));
  }, [assignedOrganizations, open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const filteredOrganizations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return options;
    return options.filter((organization) => organization.name.toLowerCase().includes(query));
  }, [options, searchQuery]);

  const selectedCount = selectedIds.length;

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={styles.wrapper}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-organizations-title"
      >
        <header className={styles.header}>
          <div>
            <h2 id="assign-organizations-title" className={styles.title}>
              Assign NPO to Tag
            </h2>
            <p className={styles.subtitle}>Choose organizations for {tagName}.</p>
          </div>

          <button type="button" className={styles.closeButton} aria-label="Close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 6L6 18M18 18L6 6"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </header>

        <div className={styles.toolbar}>
          <label className="relative block w-full max-w-[363px]" htmlFor={searchId}>
            <span className="sr-only">Search organizations</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon className="h-[18px] w-[18px] text-[#6c6c6c]" />
            </span>
            <input
              id={searchId}
              ref={searchInputRef}
              type="search"
              placeholder="Search organizations"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-[44px] w-full rounded-[100px] border border-[#b4b4b4] bg-white pl-[42px] pr-4 text-[14px] text-[#484848] placeholder:text-[#6c6c6c] outline-none"
            />
          </label>

          <button
            type="button"
            aria-label="Filter organizations"
            className="flex h-[44px] w-[44px] items-center justify-center rounded-[60px] border border-[#b4b4b4]"
          >
            <FilterIcon className="h-[18px] w-[18px] text-[#6c6c6c]" />
          </button>
        </div>

        <p className={styles.count}>{selectedCount} selected</p>

        <div className={styles.listWrapper}>
          {filteredOrganizations.length === 0 ? (
            <div className={styles.emptyState}>No organizations match your search.</div>
          ) : (
            filteredOrganizations.map((organization) => {
              const checked = selectedIds.includes(organization.id);

              return (
                <div
                  key={organization.id}
                  className={classNames(styles.row, checked && "bg-[#f2f9f8]")}
                >
                  <label className={styles.rowLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={checked}
                      onChange={() => {
                        setSelectedIds((current) =>
                          current.includes(organization.id)
                            ? current.filter((id) => id !== organization.id)
                            : [...current, organization.id],
                        );
                      }}
                    />
                    <span>
                      <span className={styles.name}>{organization.name}</span>
                      <span className={styles.website}>
                        {formatWebsiteLabel(organization.website)}
                      </span>
                    </span>
                  </label>
                </div>
              );
            })
          )}
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={() => {
              const selectedOrganizations = options.filter((organization) =>
                selectedIds.includes(organization.id),
              );
              onSave(selectedOrganizations);
              requestAnimationFrame(() => restoreFocusRef?.current?.focus());
            }}
          >
            Save
          </button>
        </footer>
      </div>
    </div>
  );
}

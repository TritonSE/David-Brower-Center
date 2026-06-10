"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AddAdminPopup from "./AddAdminPopup";
import {
  ManageAddIcon,
  ManageEditIcon,
  ManageFilterIcon,
  ManageSearchIcon,
  TrashIcon,
} from "./icons/AppIcons";

import { deleteUser, getUsers, type UserAccount } from "@/api/users";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

function getDisplayName(user: UserAccount): string {
  if (user.name.trim()) return user.name.trim();
  const composed = [user.firstName, user.lastName].map((part) => part.trim()).filter(Boolean);
  if (composed.length > 0) return composed.join(" ");
  return user.email;
}

function getInitials(user: UserAccount): string {
  const name = getDisplayName(user);
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  const initials = words
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("");
  return initials.toUpperCase();
}

export default function UsersPanel({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const loadUsers = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await getUsers(controller.signal);
      if (controller.signal.aborted) return;
      if (!result.success) {
        setAccounts([]);
        setLoadError(result.error || "Unable to load users.");
        return;
      }
      setAccounts(result.data);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setAccounts([]);
      setLoadError(getErrorMessage(error, "Unable to load users."));
    } finally {
      if (abortRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadUsers();
    return () => abortRef.current?.abort();
  }, [loadUsers]);

  useEffect(() => {
    onCountChange?.(accounts.length);
  }, [accounts, onCountChange]);

  const visibleAccounts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter((user) => {
      return (
        getDisplayName(user).toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    });
  }, [accounts, searchQuery]);

  // Keep selection limited to rows that still exist in the current list.
  const selectedVisibleIds = useMemo(
    () => selectedIds.filter((id) => visibleAccounts.some((user) => user.id === id)),
    [selectedIds, visibleAccounts],
  );
  const allVisibleSelected =
    visibleAccounts.length > 0 && selectedVisibleIds.length === visibleAccounts.length;

  const toggleRow = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  const toggleAll = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleAccounts.some((user) => user.id === id));
      }
      const visibleIds = visibleAccounts.map((user) => user.id);
      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const handleFormSuccess = useCallback((user: UserAccount) => {
    setAccounts((current) => {
      const exists = current.some((existing) => existing.id === user.id);
      return exists
        ? current.map((existing) => (existing.id === user.id ? user : existing))
        : [user, ...current];
    });
  }, []);

  const openAddForm = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const openEditForm = (user: UserAccount) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const handleConfirmRemove = async () => {
    if (isRemoving || selectedVisibleIds.length === 0) return;
    setIsRemoving(true);
    setRemoveError(null);

    const outcomes = await Promise.all(
      selectedVisibleIds.map(async (id) => {
        try {
          const result = await deleteUser(id);
          return { id, ok: result.success };
        } catch (error) {
          return { id, ok: false, message: getErrorMessage(error, id) };
        }
      }),
    );

    const removedIds = outcomes.filter((outcome) => outcome.ok).map((outcome) => outcome.id);
    const failureCount = outcomes.length - removedIds.length;

    if (removedIds.length > 0) {
      setAccounts((current) => current.filter((user) => !removedIds.includes(user.id)));
      setSelectedIds((current) => current.filter((value) => !removedIds.includes(value)));
    }

    setIsRemoving(false);
    if (failureCount > 0) {
      setRemoveError(`Unable to remove ${failureCount.toString()} account(s).`);
    } else {
      setIsRemoveConfirmOpen(false);
    }
  };

  const removeDisabled = selectedVisibleIds.length === 0;

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex items-center justify-between gap-[24px] pr-[13px]">
        <div className="flex items-center gap-[8px]">
          <label className="relative block w-[240px] md:w-[363px]">
            <span className="sr-only">Search accounts</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <ManageSearchIcon className="h-[18px] w-[18px] text-[#6c6c6c]" />
            </span>
            <input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-[44px] w-full rounded-[100px] border border-[#b4b4b4] bg-white pl-[42px] pr-4 text-[16px] font-normal text-[#484848] placeholder:text-[#6c6c6c] outline-none"
            />
          </label>

          <button
            type="button"
            aria-label="Open filters"
            className="flex h-[44px] w-[44px] items-center justify-center rounded-[60px] border border-[#b4b4b4]"
          >
            <ManageFilterIcon className="h-[20px] w-[20px] text-[#6c6c6c]" />
          </button>
        </div>

        <div className="flex items-center gap-[32px]">
          <button
            type="button"
            disabled={removeDisabled}
            onClick={() => {
              setRemoveError(null);
              setIsRemoveConfirmOpen(true);
            }}
            className={classNames(
              "font-proxima inline-flex items-center gap-[8px] text-[17px] font-semibold transition-colors",
              removeDisabled
                ? "cursor-not-allowed text-[#909090]"
                : "text-[#d14343] hover:text-[#b23030]",
            )}
          >
            <TrashIcon className="h-[20px] w-[20px]" />
            <span>Remove Admin</span>
          </button>

          <button
            type="button"
            className="font-proxima inline-flex items-center gap-[12px] text-[17px] font-semibold text-[#3b9a9a]"
            onClick={openAddForm}
          >
            <ManageAddIcon className="h-[18px] w-[18px]" />
            <span>Add Admin</span>
          </button>
        </div>
      </div>

      {removeError ? (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {removeError}
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-[#6c6c6c]">Loading accounts...</p>
      ) : loadError ? (
        <div>
          <p className="text-sm text-[#484848]">{loadError}</p>
          <button
            className="mt-3 rounded-[40px] bg-[#3b9a9a] px-4 py-2 text-sm font-semibold text-white"
            type="button"
            onClick={() => void loadUsers()}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[820px]">
            <div className="border-b border-black px-8 py-4">
              <div className="grid grid-cols-[1.5fr_1.6fr_1.2fr_1fr_auto] items-center gap-4 font-proxima text-[16px] text-black">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="h-5 w-5 rounded-[3px] border border-[#909090] accent-[#3b9a9a]"
                    aria-label="Select all accounts"
                  />
                  <span>Name</span>
                </div>
                <span>Email</span>
                <span>Phone Number</span>
                <span>Role</span>
                <span className="w-6" aria-hidden="true" />
              </div>
            </div>

            {visibleAccounts.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#6c6c6c]">
                {searchQuery.trim() ? "No accounts match your search." : "No accounts found."}
              </div>
            ) : (
              visibleAccounts.map((user, index) => {
                const striped = index % 2 === 0;
                const selected = selectedVisibleIds.includes(user.id);
                const displayName = getDisplayName(user);

                return (
                  <div
                    key={user.id}
                    className={classNames(
                      "border-b border-[#b4b4b4] px-8 py-[6px]",
                      striped ? "bg-[#f2f9f8]" : "bg-white",
                    )}
                  >
                    <div className="grid grid-cols-[1.5fr_1.6fr_1.2fr_1fr_auto] items-center gap-4">
                      <div className="flex items-center gap-[10px]">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleRow(user.id)}
                          className="h-5 w-5 rounded-[3px] border border-[#909090] accent-[#3b9a9a]"
                          aria-label={`Select ${displayName}`}
                        />
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d9d9d9] bg-white text-[16px] text-[#3b9a9a]">
                          {getInitials(user)}
                        </span>
                        <span className="font-proxima text-[14px] tracking-[0.28px] text-black">
                          {displayName}
                        </span>
                      </div>

                      <a
                        href={`mailto:${user.email}`}
                        className="font-proxima truncate text-[14px] text-[#484848] underline decoration-from-font"
                      >
                        {user.email}
                      </a>

                      <span className="font-proxima text-[14px] text-[#484848]">
                        {user.phone || "—"}
                      </span>

                      <span className="font-proxima text-[14px] text-[#484848]">
                        {user.role || "—"}
                      </span>

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          aria-label={`Edit ${displayName}`}
                          onClick={() => openEditForm(user)}
                          className="flex h-6 w-6 items-center justify-center"
                        >
                          <ManageEditIcon className="block h-5 w-5 text-[#6c6c6c]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <AddAdminPopup
        open={isFormOpen}
        mode={editingUser ? "edit" : "create"}
        user={editingUser}
        onClose={closeForm}
        onSuccess={handleFormSuccess}
      />

      {isRemoveConfirmOpen ? (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isRemoving) setIsRemoveConfirmOpen(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-admin-title"
            className="w-full max-w-[420px] rounded-[24px] border border-[#d9d9d9] bg-white p-6"
          >
            <h3 id="remove-admin-title" className="text-[18px] font-semibold text-black">
              Remove {selectedVisibleIds.length.toString()} account(s)?
            </h3>
            <p className="mt-2 text-[14px] text-[#484848]">
              This permanently deletes the selected account(s) and their sign-in access. This cannot
              be undone.
            </p>
            {removeError ? <p className="mt-3 text-[14px] text-red-600">{removeError}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isRemoving}
                onClick={() => setIsRemoveConfirmOpen(false)}
                className="rounded-[40px] border border-[#b4b4b4] px-4 py-2 text-[14px] font-semibold text-[#484848] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemoving}
                onClick={() => void handleConfirmRemove()}
                className="rounded-[40px] bg-[#d14343] px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-[#b23030] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRemoving ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

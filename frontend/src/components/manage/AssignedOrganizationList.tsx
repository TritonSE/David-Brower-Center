"use client";

import { useRef, useState } from "react";

import { TrashIcon } from "../icons/AppIcons";

import RemoveAssignedOrganizationDialog from "./RemoveAssignedOrganizationDialog";

import type { AssignedOrganization } from "./types";

type AssignedOrganizationListProps = {
  onRemoveOrganization: (organizationId: string) => void;
  organizations: AssignedOrganization[];
};

function formatWebsiteLabel(website: string): string {
  return website.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export default function AssignedOrganizationList({
  onRemoveOrganization,
  organizations,
}: AssignedOrganizationListProps) {
  const [organizationPendingRemoval, setOrganizationPendingRemoval] =
    useState<AssignedOrganization | null>(null);
  const restoreFocusRef = useRef<HTMLButtonElement | null>(null);

  if (organizations.length === 0) {
    return (
      <div className="rounded-[18px] border border-dashed border-[#d9d9d9] bg-white px-4 py-5 text-sm text-[#6c6c6c]">
        No assigned organizations yet.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-[18px] border border-[#d9d9d9] bg-white">
        {organizations.map((organization, index) => (
          <div
            key={organization.id}
            className={`flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between ${index > 0 ? "border-t border-[#d9d9d9]" : ""}`}
          >
            <div className="min-w-0">
              <span className="font-proxima text-[15px] font-semibold text-black">
                {organization.name}
              </span>

              {organization.website ? (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-sm text-[#3b9a9a] underline-offset-2 hover:underline"
                >
                  {formatWebsiteLabel(organization.website)}
                </a>
              ) : (
                <span className="mt-1 block text-sm text-[#6c6c6c]">Website unavailable</span>
              )}
            </div>

            <button
              type="button"
              aria-label={`Remove ${organization.name}`}
              className="inline-flex h-10 w-10 items-center justify-center self-start rounded-full text-[#6c6c6c] transition-colors hover:bg-black/5 hover:text-[#484848] md:self-center"
              onClick={(event) => {
                restoreFocusRef.current = event.currentTarget;
                setOrganizationPendingRemoval(organization);
              }}
            >
              <TrashIcon className="h-[18px] w-[18px] shrink-0" />
            </button>
          </div>
        ))}
      </div>

      <RemoveAssignedOrganizationDialog
        open={organizationPendingRemoval !== null}
        onClose={() => {
          setOrganizationPendingRemoval(null);
          requestAnimationFrame(() => restoreFocusRef.current?.focus());
        }}
        onConfirm={() => {
          if (!organizationPendingRemoval) return;
          onRemoveOrganization(organizationPendingRemoval.id);
          setOrganizationPendingRemoval(null);
          requestAnimationFrame(() => restoreFocusRef.current?.focus());
        }}
      />
    </>
  );
}

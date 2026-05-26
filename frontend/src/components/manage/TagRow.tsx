"use client";

import { useState } from "react";

import AddTagPopup from "../AddTagPopup";
import { ChevronRightIcon } from "../icons/AppIcons";

import AssignedOrganizationList from "./AssignedOrganizationList";
import AssignOrganizationsDialog from "./AssignOrganizationsDialog";

import type { AssignedOrganization, ManageTag, ManageTagDraft } from "./types";

type TagRowProps = {
  availableOrganizations: AssignedOrganization[];
  onTagOrganizationsUpdated: (tagId: string, organizations: AssignedOrganization[]) => void;
  striped: boolean;
  tag: ManageTag;
  onTagUpdated: (tagId: string, updates: ManageTagDraft) => void;
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function TagRow({
  availableOrganizations,
  onTagOrganizationsUpdated,
  onTagUpdated,
  striped,
  tag,
}: TagRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const assignedCount = tag.assignedOrganizations.length;

  return (
    <>
      <div
        className={classNames("border-b border-[#b4b4b4]", striped ? "bg-[#f2f9f8]" : "bg-white")}
      >
        <div className="grid grid-cols-[minmax(0,1.2fr)_120px_120px_220px] items-center gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${tag.name}`}
              onClick={() => setIsExpanded((current) => !current)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d9d9d9] bg-white text-[#6c6c6c] transition-colors hover:text-[#3b9a9a]"
            >
              <ChevronRightIcon
                className={classNames(
                  "h-4 w-4 transition-transform",
                  isExpanded ? "rotate-90" : "rotate-0",
                )}
              />
            </button>

            <div className="min-w-0">
              <p className="truncate font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[15px] font-semibold text-black">
                {tag.name}
              </p>
              <p className="mt-1 text-xs text-[#6c6c6c]">
                {assignedCount > 0
                  ? `${assignedCount} assigned ${assignedCount === 1 ? "organization" : "organizations"}`
                  : "No assigned organizations"}
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <span
              className={classNames(
                "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                tag.visibility === "public"
                  ? "bg-[#d8efef] text-[#2f7f7f]"
                  : "bg-[#f3f4f6] text-[#6c6c6c]",
              )}
            >
              {tag.visibility === "public" ? "Public" : "Private"}
            </span>
          </div>

          <span className="text-right font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[14px] text-[#484848]">
            {assignedCount}
          </span>

          <div className="flex justify-end">
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-[40px] bg-[#3b9a9a] px-4 py-[9px] text-sm font-semibold text-white transition-colors hover:brightness-95"
                onClick={() => setIsAssignOpen(true)}
              >
                Assign NPOs
              </button>
              <button
                type="button"
                className="rounded-[40px] border border-[#3b9a9a] px-4 py-[9px] text-sm font-semibold text-[#3b9a9a] transition-colors hover:bg-[#3b9a9a] hover:text-white"
                onClick={() => setIsEditOpen(true)}
              >
                Edit Tag
              </button>
            </div>
          </div>
        </div>

        {isExpanded ? (
          <div className="border-t border-[#d9d9d9] bg-[#fbfbfb] px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[14px] font-semibold text-black">
                Assigned NPOs
              </p>
              <span className="text-sm text-[#6c6c6c]">{assignedCount} total</span>
            </div>
            <AssignedOrganizationList organizations={tag.assignedOrganizations} />
          </div>
        ) : null}
      </div>

      <AddTagPopup
        mode="edit"
        open={isEditOpen}
        initialValues={{
          color: tag.color,
          name: tag.name,
          visibility: tag.visibility,
        }}
        onClose={() => setIsEditOpen(false)}
        onSaveLocal={(updates) => onTagUpdated(tag.id, updates)}
      />

      <AssignOrganizationsDialog
        assignedOrganizations={tag.assignedOrganizations}
        availableOrganizations={availableOrganizations}
        open={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSave={(organizations) => {
          onTagOrganizationsUpdated(tag.id, organizations);
          setIsExpanded(true);
          setIsAssignOpen(false);
        }}
        tagName={tag.name}
      />
    </>
  );
}

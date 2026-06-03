"use client";
import { useRef, useState } from "react";

import AddTagPopup from "../AddTagPopup";
import { ManageCaretIcon, ManageEditIcon } from "../icons/AppIcons";

import AssignedOrganizationList from "./AssignedOrganizationList";
import AssignOrganizationsDialog from "./AssignOrganizationsDialog";

import type { InlineToastAction } from "./InlineToast";
import type { AssignedOrganization, ManageTag, ManageTagDraft } from "./types";

import { proximaFontStyle, rubikFontStyle } from "@/styles/fontStyles";

type ToastConfig = {
  action?: InlineToastAction;
  message: string;
};

type TagRowProps = {
  availableOrganizations: AssignedOrganization[];
  highlightState?: "none" | "fresh" | "fading";
  onShowSuccessToast: (toast: ToastConfig) => void;
  onTagDeleted: (tagId: string) => Promise<void>;
  onTagOrganizationsUpdated: (
    tagId: string,
    organizations: AssignedOrganization[],
  ) => Promise<void>;
  tag: ManageTag;
  onTagUpdated: (tagId: string, updates: ManageTagDraft) => Promise<void>;
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const actionButtonClassName =
  "font-proxima inline-flex items-center justify-center gap-[10px] rounded-[40px] border border-[#b4b4b4] bg-white px-[16px] py-[8px] text-[13px] leading-none font-medium whitespace-nowrap text-[#3b9a9a] transition-colors hover:border-[#3b9a9a]";

const assignIconClassName = "inline-flex h-[13px] w-[13px] shrink-0 items-center justify-center";
const editIconClassName = "inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center";

export default function TagRow({
  availableOrganizations,
  highlightState = "none",
  onShowSuccessToast,
  onTagDeleted,
  onTagOrganizationsUpdated,
  onTagUpdated,
  tag,
}: TagRowProps) {
  const assignButtonRef = useRef<HTMLButtonElement | null>(null);
  const editButtonRef = useRef<HTMLButtonElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const assignedCount = tag.assignedOrganizations.length;

  return (
    <>
      <div
        ref={rowRef}
        className={classNames(
          "border-b border-[#b4b4b4] transition-colors duration-[800ms]",
          highlightState === "fresh" ? "bg-[#cdebeb]" : "bg-[#f2f9f8]",
        )}
        style={proximaFontStyle}
      >
        <div className="flex flex-col gap-3 px-8 py-3 md:flex-row md:items-center md:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${tag.name}`}
              onClick={() => setIsExpanded((current) => !current)}
              className="flex h-6 w-6 shrink-0 items-center justify-center text-black transition-colors hover:text-[#3b9a9a]"
            >
              <ManageCaretIcon
                className={classNames(
                  "h-6 w-6 transition-transform",
                  isExpanded ? "rotate-90" : "rotate-0",
                )}
              />
            </button>

            <div className="min-w-0">
              <p className="font-proxima truncate text-[16px] font-semibold text-black">
                {tag.name}
              </p>
              <p
                className="font-rubik mt-[2px] text-[12px] font-normal tracking-[0.24px] text-[#6c6c6c]"
                style={rubikFontStyle}
              >
                {assignedCount > 0
                  ? `${assignedCount} ${assignedCount === 1 ? "NPO" : "NPOs"}`
                  : "No assigned NPOs"}
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1" />

          <div className="flex flex-wrap gap-2 md:justify-end">
            <button
              ref={assignButtonRef}
              type="button"
              className={actionButtonClassName}
              onClick={() => setIsAssignOpen(true)}
            >
              <span className={assignIconClassName} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" className="h-[13px] w-[13px] text-[#3b9a9a]">
                  <path
                    d="M12 4.5V19.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4.5 12H19.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span>Assign NPOs</span>
            </button>
            <button
              ref={editButtonRef}
              type="button"
              className={actionButtonClassName}
              onClick={() => setIsEditOpen(true)}
            >
              <span className={editIconClassName} aria-hidden="true">
                <ManageEditIcon className="h-[14px] w-[14px] text-[#3b9a9a]" />
              </span>
              <span>Edit Tag</span>
            </button>
          </div>
        </div>

        {isExpanded ? (
          <div className="border-t border-[#d9d9d9] bg-[#fbfbfb] px-8 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-proxima text-[14px] font-semibold text-black">Assigned NPOs</p>
              <span className="text-sm text-[#6c6c6c]">{assignedCount} total</span>
            </div>
            <AssignedOrganizationList
              organizations={tag.assignedOrganizations}
              onRemoveOrganization={(organizationId) => {
                void onTagOrganizationsUpdated(
                  tag.id,
                  tag.assignedOrganizations.filter(
                    (organization) => organization.id !== organizationId,
                  ),
                );
                setIsExpanded(true);
                onShowSuccessToast({ message: "Removed NPO from tag." });
              }}
            />
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
        onClose={() => {
          setIsEditOpen(false);
          requestAnimationFrame(() => editButtonRef.current?.focus());
        }}
        onDelete={async () => {
          await onTagDeleted(tag.id);
          setIsEditOpen(false);
          requestAnimationFrame(() => editButtonRef.current?.focus());
          onShowSuccessToast({ message: "Tag has been deleted." });
        }}
        onSaveLocal={(updates) => void onTagUpdated(tag.id, updates)}
        restoreFocusRef={editButtonRef}
      />

      <AssignOrganizationsDialog
        assignedOrganizations={tag.assignedOrganizations}
        availableOrganizations={availableOrganizations}
        open={isAssignOpen}
        onClose={() => {
          setIsAssignOpen(false);
          requestAnimationFrame(() => assignButtonRef.current?.focus());
        }}
        onSave={(organizations) => {
          void onTagOrganizationsUpdated(tag.id, organizations);
          setIsAssignOpen(false);
          onShowSuccessToast({
            message: "NPOs have been assigned to tag.",
            action: {
              label: "View",
              onClick: () => {
                setIsExpanded(true);
                rowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              },
            },
          });
        }}
        restoreFocusRef={assignButtonRef}
        tagName={tag.name}
      />
    </>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";

import AddTagPopup from "../AddTagPopup";
import {
  LockIcon,
  PlusSmallIcon,
  PublicGlobeIcon,
  SearchIcon,
  TagFilledIcon,
  TuneFilterIcon,
} from "../icons/AppIcons";

import InlineToast from "./InlineToast";
import TagRow from "./TagRow";

import type { AssignedOrganization, ManageTag, ManageTagDraft } from "./types";
import type { TagRecord, TagVisibility } from "@/api/tags";
import { proximaFontStyle } from "@/styles/fontStyles";

export const STATIC_TAGS: ManageTag[] = [
  {
    id: "tag-environmental",
    color: "#77A881",
    name: "Environmental",
    visibility: "public",
    assignedOrganizations: [
      { id: "org-1", name: "Calflora", website: "https://www.calflora.org/" },
      { id: "org-2", name: "Friends of Alemany Farm", website: "http://www.alemanyfarm.org/" },
    ],
  },
  {
    id: "tag-social",
    color: "#EFA54D",
    name: "Social",
    visibility: "private",
    assignedOrganizations: [
      { id: "org-3", name: "Food Shift", website: "http://www.foodshift.net/" },
    ],
  },
  {
    id: "tag-community",
    color: "#5A8FBB",
    name: "Community Resilience",
    visibility: "public",
    assignedOrganizations: [
      { id: "org-4", name: "Green Schoolyards America", website: "http://greenschoolyards.org" },
    ],
  },
];

type TagDashboardProps = {
  availableOrganizations: AssignedOrganization[];
  tags: ManageTag[];
  onTagCreated: (tag: TagRecord) => void;
  onTagOrganizationsUpdated: (tagId: string, organizations: AssignedOrganization[]) => void;
  onTagUpdated: (tagId: string, updates: ManageTagDraft) => void;
};

type VisibilityFilter = "all" | TagVisibility;
type ToastState = {
  action?: {
    label: string;
    onClick: () => void;
  };
  message: string;
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const visibilityFilters = [
  {
    label: "All",
    value: "all",
    icon: TagFilledIcon,
  },
  {
    label: "Published",
    value: "public",
    icon: PublicGlobeIcon,
  },
  {
    label: "Drafts",
    value: "private",
    icon: LockIcon,
  },
] as const;

export default function TagDashboard({
  availableOrganizations,
  onTagCreated,
  onTagOrganizationsUpdated,
  onTagUpdated,
  tags,
}: TagDashboardProps) {
  const createTagButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVisibilityFilter, setActiveVisibilityFilter] = useState<VisibilityFilter>("all");
  const [toast, setToast] = useState<ToastState | null>(null);

  const filteredTags = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return tags.filter((tag) => {
      const matchesQuery =
        normalizedQuery.length === 0 || tag.name.toLowerCase().includes(normalizedQuery);
      const matchesVisibility =
        activeVisibilityFilter === "all" || tag.visibility === activeVisibilityFilter;
      return matchesQuery && matchesVisibility;
    });
  }, [activeVisibilityFilter, searchQuery, tags]);

  const hasNoTags = tags.length === 0;
  const hasNoFilteredResults = !hasNoTags && filteredTags.length === 0;

  return (
    <>
      <div className="flex flex-col gap-[24px]" style={proximaFontStyle}>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block w-[240px] md:w-[363px]">
            <span className="sr-only">Search tags</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon className="h-[18px] w-[18px] text-[#6c6c6c]" />
            </span>
            <input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-[44px] w-full rounded-[100px] border border-[#b4b4b4] bg-white pl-[42px] pr-4 text-[14px] text-[#484848] placeholder:text-[#6c6c6c] outline-none"
            />
          </label>

          <button
            type="button"
            aria-label="Filter tags"
            className="flex h-[44px] w-[44px] items-center justify-center rounded-[60px] border border-[#b4b4b4] bg-white text-[#6c6c6c]"
          >
            <TuneFilterIcon className="h-[18px] w-[18px]" />
          </button>

          {visibilityFilters.map((filter) => {
            const Icon = filter.icon;

            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={activeVisibilityFilter === filter.value}
                onClick={() => setActiveVisibilityFilter(filter.value as VisibilityFilter)}
                className={classNames(
                  "font-proxima inline-flex items-center gap-[2px] rounded-[10px] border px-[8px] py-[8px] text-[16px] leading-none font-normal",
                  activeVisibilityFilter === filter.value
                    ? "border-[#3b9a9a] bg-[rgba(156,204,204,0.5)] text-[#2c7d7d]"
                    : "border-[#d9d9d9] bg-white text-[#6c6c6c]",
                )}
              >
                <Icon className="h-[19px] w-[19px]" />
                {filter.label}
              </button>
            );
          })}

          <div className="hidden min-w-0 flex-1 md:block" />

          <button
            ref={createTagButtonRef}
            type="button"
            className="font-proxima inline-flex items-center gap-[4px] rounded-[40px] bg-[#3b9a9a] px-[16px] py-[10px] text-[17px] font-semibold text-white md:ml-auto"
            onClick={() => setIsAddTagOpen(true)}
          >
            <PlusSmallIcon className="h-5 w-5" />
            Create New Tag
          </button>
        </div>

        <div className="flex flex-col">
          <div className="border-b border-black px-8 py-4">
            <div className="font-proxima flex items-center gap-[4px] text-[16px] font-normal text-black">
              <span className="inline-flex items-center justify-center text-[#1f1f1f]">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                  className="h-[14px] w-[14px]"
                >
                  <path d="m8 3 4 5H4l4-5Z" fill="currentColor" />
                  <path d="M8 13V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </span>
              <span>Tag Name</span>
            </div>
          </div>

          <div>
            {hasNoTags ? (
              <div className="rounded-[24px] border border-dashed border-[#d9d9d9] bg-[#fbfbfb] px-6 py-10 text-center">
                <p className="font-proxima text-[18px] font-semibold text-black">No tags yet</p>
                <p className="mt-2 text-sm text-[#6c6c6c]">
                  Create your first tag to start organizing NPOs.
                </p>
              </div>
            ) : hasNoFilteredResults ? (
              <div className="rounded-[24px] border border-dashed border-[#d9d9d9] bg-[#fbfbfb] px-6 py-10 text-center">
                <p className="font-proxima text-[18px] font-semibold text-black">
                  No matching tags
                </p>
                <p className="mt-2 text-sm text-[#6c6c6c]">
                  Try a different search or visibility filter.
                </p>
              </div>
            ) : (
              filteredTags.map((tag) => (
                <TagRow
                  availableOrganizations={availableOrganizations}
                  key={tag.id}
                  onShowSuccessToast={(nextToast) => setToast(nextToast)}
                  onTagOrganizationsUpdated={onTagOrganizationsUpdated}
                  onTagUpdated={onTagUpdated}
                  tag={tag}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <AddTagPopup
        open={isAddTagOpen}
        onClose={() => {
          setIsAddTagOpen(false);
          requestAnimationFrame(() => createTagButtonRef.current?.focus());
        }}
        onSuccess={(tag) => {
          onTagCreated(tag);
          setToast({ message: "Tag has been added." });
        }}
        restoreFocusRef={createTagButtonRef}
      />

      {toast ? (
        <InlineToast action={toast.action} message={toast.message} onClose={() => setToast(null)} />
      ) : null}
    </>
  );
}

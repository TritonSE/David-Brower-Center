"use client";

import { useState } from "react";

import AddTagPopup from "../AddTagPopup";
import { FilterIcon, SearchIcon } from "../icons/AppIcons";

import TagRow from "./TagRow";

import type { AssignedOrganization, ManageTag, ManageTagDraft } from "./types";
import type { TagRecord } from "@/api/tags";

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

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function TagDashboard({
  availableOrganizations,
  onTagCreated,
  onTagOrganizationsUpdated,
  onTagUpdated,
  tags,
}: TagDashboardProps) {
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-[24px]">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            className="rounded-[40px] bg-[#3b9a9a] px-5 py-[10px] font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[16px] font-semibold text-white"
            onClick={() => setIsAddTagOpen(true)}
          >
            Create New Tag
          </button>
          <div className="h-4 flex-1" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block w-[240px] md:w-[363px]">
            <span className="sr-only">Search tags</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon className="h-[18px] w-[18px] text-[#6c6c6c]" />
            </span>
            <input
              type="search"
              placeholder="Search"
              className="h-[44px] w-full rounded-[100px] border border-[#b4b4b4] bg-white pl-[42px] pr-4 text-[14px] text-[#484848] placeholder:text-[#6c6c6c] outline-none"
              readOnly
            />
          </label>

          <button
            type="button"
            aria-label="Open filters"
            className="flex h-[44px] w-[44px] items-center justify-center rounded-[60px] border border-[#b4b4b4]"
          >
            <FilterIcon className="h-[18px] w-[18px] text-[#6c6c6c]" />
          </button>

          {(["All", "Public", "Private"] as const).map((filter, index) => (
            <button
              key={filter}
              type="button"
              className={classNames(
                "rounded-[40px] border px-4 py-[10px] font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[14px] font-medium",
                index === 0
                  ? "border-[#3b9a9a] bg-[#f2f9f8] text-[#3b9a9a]"
                  : "border-[#d9d9d9] bg-white text-[#6c6c6c]",
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex flex-col">
          <div className="border-b border-[#d9d9d9] px-4 py-3 text-sm font-semibold text-black">
            <div className="grid grid-cols-[minmax(0,1.2fr)_120px_120px_220px] items-center gap-4">
              <span>Tag Name</span>
              <span className="text-center">Visibility</span>
              <span className="text-right">Assigned NPOs</span>
              <span className="text-right">Actions</span>
            </div>
          </div>

          <div>
            {tags.map((tag, index) => (
              <TagRow
                availableOrganizations={availableOrganizations}
                key={tag.id}
                onTagOrganizationsUpdated={onTagOrganizationsUpdated}
                onTagUpdated={onTagUpdated}
                striped={index % 2 === 0}
                tag={tag}
              />
            ))}
          </div>
        </div>
      </div>

      <AddTagPopup
        open={isAddTagOpen}
        onClose={() => setIsAddTagOpen(false)}
        onSuccess={onTagCreated}
      />
    </>
  );
}

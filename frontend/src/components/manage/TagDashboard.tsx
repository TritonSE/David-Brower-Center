"use client";

import { useState } from "react";

import AddTagPopup from "../AddTagPopup";
import { FilterIcon, SearchIcon } from "../icons/AppIcons";

import type { ManageTag } from "./types";
import type { TagRecord } from "@/api/tags";

export const STATIC_TAGS: ManageTag[] = [
  {
    id: "tag-environmental",
    name: "Environmental",
    visibility: "public",
    organizationCount: 5,
    assignedOrganizations: [
      { id: "org-1", name: "Calflora", website: "https://www.calflora.org/" },
      { id: "org-2", name: "Friends of Alemany Farm", website: "http://www.alemanyfarm.org/" },
    ],
  },
  {
    id: "tag-social",
    name: "Social",
    visibility: "private",
    organizationCount: 20,
    assignedOrganizations: [
      { id: "org-3", name: "Food Shift", website: "http://www.foodshift.net/" },
    ],
  },
  {
    id: "tag-community",
    name: "Community Resilience",
    visibility: "public",
    organizationCount: 10,
    assignedOrganizations: [
      { id: "org-4", name: "Green Schoolyards America", website: "http://greenschoolyards.org" },
    ],
  },
];

type TagDashboardProps = {
  tags: ManageTag[];
  onTagCreated: (tag: TagRecord) => void;
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function TagDashboard({ tags, onTagCreated }: TagDashboardProps) {
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
            <div className="grid grid-cols-[minmax(0,1.5fr)_140px_140px] items-center gap-4">
              <span>Tag Name</span>
              <span className="text-center">Visibility</span>
              <span className="text-right">Assigned NPOs</span>
            </div>
          </div>

          <div>
            {tags.map((tag, index) => (
              <div
                key={tag.id}
                className={classNames(
                  "border-b border-[#b4b4b4] py-3",
                  index % 2 === 0 ? "bg-[#f2f9f8]" : "bg-white",
                )}
              >
                <div className="grid grid-cols-[minmax(0,1.5fr)_140px_140px] items-center gap-4 px-4">
                  <div>
                    <p className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[15px] font-semibold text-black">
                      {tag.name}
                    </p>
                    <p className="mt-1 text-xs text-[#6c6c6c]">
                      {tag.assignedOrganizations.length > 0
                        ? tag.assignedOrganizations
                            .slice(0, 2)
                            .map((organization) => organization.name)
                            .join(", ")
                        : "No assigned organizations"}
                    </p>
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
                    {tag.organizationCount}
                  </span>
                </div>
              </div>
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

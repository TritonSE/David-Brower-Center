"use client";

import type { AssignedOrganization } from "./types";

type AssignedOrganizationListProps = {
  organizations: AssignedOrganization[];
};

function formatWebsiteLabel(website: string): string {
  return website.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export default function AssignedOrganizationList({ organizations }: AssignedOrganizationListProps) {
  if (organizations.length === 0) {
    return (
      <div className="rounded-[18px] border border-dashed border-[#d9d9d9] bg-white px-4 py-5 text-sm text-[#6c6c6c]">
        No assigned organizations yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#d9d9d9] bg-white">
      {organizations.map((organization, index) => (
        <div
          key={organization.id}
          className={`flex flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:justify-between ${index > 0 ? "border-t border-[#d9d9d9]" : ""}`}
        >
          <span className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[15px] font-semibold text-black">
            {organization.name}
          </span>

          {organization.website ? (
            <a
              href={organization.website}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#3b9a9a] underline-offset-2 hover:underline"
            >
              {formatWebsiteLabel(organization.website)}
            </a>
          ) : (
            <span className="text-sm text-[#6c6c6c]">Website unavailable</span>
          )}
        </div>
      ))}
    </div>
  );
}

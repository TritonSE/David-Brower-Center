"use client";

import { useState } from "react";

import RelatedNpoItemCard from "./RelatedNpoItemCard";

export type RelationshipTier = "primary" | "secondary" | "tertiary";

export type RelatedNpo = {
  id: string;
  name: string;
  locationLabel: string;
  budgetLabel: string;
  sizeLabel: string;
  tags: string[];
  logoUrl?: string;
};

type RelationshipViewCardProps = {
  organizations: RelatedNpo[];
  initialTier?: RelationshipTier;
  onTierChange?: (tier: RelationshipTier) => void;
  className?: string;
};

const tierButtons: { value: RelationshipTier; label: string }[] = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "tertiary", label: "Tertiary" },
];

export default function RelationshipViewCard({
  organizations,
  initialTier = "primary",
  onTierChange,
  className,
}: RelationshipViewCardProps) {
  const [activeTier, setActiveTier] = useState<RelationshipTier>(initialTier);

  // All tabs intentionally use the same data until relationship-strength mapping is available.
  const visibleOrganizations = organizations;

  return (
    <section className={`w-full ${className ?? ""}`.trim()}>
      <div>
        <h3 className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[16px]/[normal] font-bold text-black">
          Related NPOs
        </h3>
        <p className="mt-1 font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[14px]/[normal] font-normal text-[#484848]">
          explanation for primary, secondary, tertiary?
        </p>
      </div>

      <div className="mt-[16px] flex w-full items-center gap-1 rounded-[30px] border border-[#d9d9d9] bg-white p-2">
        {tierButtons.map((tierButton) => {
          const isActive = tierButton.value === activeTier;

          return (
            <button
              key={tierButton.value}
              type="button"
              onClick={() => {
                setActiveTier(tierButton.value);
                onTierChange?.(tierButton.value);
              }}
              className={`flex-1 rounded-[40px] px-6 py-1 font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-base/[32px] font-normal transition-colors ${
                isActive ? "bg-[#3b9a9a] text-white" : "text-[#909090] hover:bg-[#f7f7f7]"
              }`}
              aria-pressed={isActive}
            >
              {tierButton.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 w-full rounded-[16px] border border-[#d9d9d9] bg-white p-4">
        <div className="flex h-[576px] flex-col gap-[10px] overflow-y-auto pr-1">
          {visibleOrganizations.map((organization) => (
            <RelatedNpoItemCard key={organization.id} organization={organization} />
          ))}
        </div>
      </div>
    </section>
  );
}

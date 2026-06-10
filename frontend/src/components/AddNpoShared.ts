import type { OrganizationRelationshipTier } from "@/api/organization";

export type AddNpoStep = "profile" | "relationships" | "review";

export type SelectedFocusArea = {
  id: string;
  name: string;
};

export type NpoProfileValues = {
  title: string;
  website: string;
  description: string;
  mission: string;
  mediaFiles: File[];
  location: string;
  npoSize: string;
  budgetSize: string;
  focusAreaQuery: string;
  focusAreas: SelectedFocusArea[];
};

export const NPO_SIZE_OPTIONS = ["Large", "Medium", "Small", "Grassroots"] as const;

export const LOCATION_OPTIONS = [
  "Berkeley, CA",
  "Oakland, CA",
  "San Francisco, CA",
  "San Jose, CA",
  "Los Angeles, CA",
  "Sacramento, CA",
] as const;

export type DraftRelationship = {
  id: string;
  partnerOrgId: string;
  partnerName: string;
  partnerCategory: string;
  tier: OrganizationRelationshipTier;
};

export type AddNpoState = {
  profile: NpoProfileValues;
  relationships: DraftRelationship[];
};

export const TIER_OPTIONS: Array<{
  tier: OrganizationRelationshipTier;
  label: string;
  example: string;
}> = [
  { tier: "PRIMARY", label: "Primary", example: "eg. Direct Partnership" },
  { tier: "SECONDARY", label: "Secondary", example: "eg. Shared Parent Company" },
  { tier: "TERTIARY", label: "Tertiary", example: "eg. Similar Focus Area" },
];

export function getOrgInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function tierLabel(tier: OrganizationRelationshipTier): string {
  return TIER_OPTIONS.find((option) => option.tier === tier)?.label ?? tier;
}

export function tierBadgeClassName(
  _tier: OrganizationRelationshipTier,
  styles: Record<string, string>,
): string {
  return styles.tierBadge ?? "";
}

export function createEmptyProfile(initialTitle = "", initialDescription = ""): NpoProfileValues {
  return {
    title: initialTitle,
    website: "",
    description: initialDescription,
    mission: "",
    mediaFiles: [],
    location: "",
    npoSize: "",
    budgetSize: "",
    focusAreaQuery: "",
    focusAreas: [],
  };
}

export function generateProjectId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = crypto.randomUUID().slice(0, 8);
  return slug.length > 0 ? `${slug}-${suffix}` : `npo-${suffix}`;
}

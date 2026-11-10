import type {
  OrganizationDetail,
  OrganizationListItem,
  OrganizationRelationship,
  OrganizationRelationshipTier,
} from "@/api/organization";

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
  /** Already-uploaded image URLs (edit mode). Removing one here deletes it on publish. */
  existingImages: string[];
  /** New files to upload on publish. */
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

export const BUDGET_OPTIONS = [
  "Under $100K",
  "$100K–$500K",
  "$500K–$1M",
  "$1M–$5M",
  "$5M+",
] as const;

const BUDGET_UPPER_BOUNDS: [number, (typeof BUDGET_OPTIONS)[number]][] = [
  [100_000, "Under $100K"],
  [500_000, "$100K–$500K"],
  [1_000_000, "$500K–$1M"],
  [5_000_000, "$1M–$5M"],
];

/**
 * Map a budget value (e.g. from a CSV autofill: "$1.2M", "500k", "1,200,000")
 * to one of BUDGET_OPTIONS. Returns "" when it cannot be interpreted.
 */
export function toBudgetRange(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const existing = BUDGET_OPTIONS.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;

  const match = /^\$?\s*(\d[\d,]*(?:\.\d+)?|\.\d+)\s*([kmb])?$/i.exec(trimmed);
  if (!match) return "";

  const multipliers: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 };
  const amount =
    Number(match[1].replace(/,/g, "")) * (match[2] ? multipliers[match[2].toLowerCase()] : 1);
  if (!Number.isFinite(amount)) return "";

  for (const [upperBound, label] of BUDGET_UPPER_BOUNDS) {
    if (amount < upperBound) return label;
  }
  return "$5M+";
}

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

export function createEmptyProfile(): NpoProfileValues {
  return {
    title: "",
    website: "",
    description: "",
    mission: "",
    existingImages: [],
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

export function createEmptyState(): AddNpoState {
  return { profile: createEmptyProfile(), relationships: [] };
}

/**
 * Builds the wizard state for editing an existing organization. Relationships are
 * undirected in the UI, so ones created from either side are included.
 */
export function createEditState(
  detail: OrganizationDetail,
  allRelationships: OrganizationRelationship[],
  organizations: OrganizationListItem[],
): AddNpoState {
  const orgsById = new Map(organizations.map((org) => [org.id, org]));
  const seen = new Set<string>();
  const relationships: DraftRelationship[] = [];

  for (const relationship of allRelationships) {
    const partnerId =
      relationship.npo1Id === detail.id
        ? relationship.npo2Id
        : relationship.npo2Id === detail.id
          ? relationship.npo1Id
          : null;
    const partner = partnerId ? orgsById.get(partnerId) : undefined;
    if (!partner) continue;

    const key = `${partner.id}:${relationship.relationshipTier}`;
    if (seen.has(key)) continue;
    seen.add(key);

    relationships.push({
      id: relationship.id,
      partnerOrgId: partner.id,
      partnerName: partner.name,
      partnerCategory: partner.tags[0]?.name ?? partner.focus,
      tier: relationship.relationshipTier,
    });
  }

  const { fields } = detail;
  return {
    profile: {
      ...createEmptyProfile(),
      title: detail.name,
      website: fields.website ?? "",
      description: fields.description ?? "",
      mission: fields.mission ?? "",
      existingImages: detail.images,
      location: fields.location ?? "",
      npoSize: fields.sizeCategory ?? "",
      budgetSize: fields.budget ?? "",
      focusAreas: detail.tags.map((tag) => ({ id: tag.id, name: tag.name })),
    },
    relationships,
  };
}

function sameItems(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

export function focusAreasChanged(initial: NpoProfileValues, current: NpoProfileValues): boolean {
  const ids = (profile: NpoProfileValues) => profile.focusAreas.map((area) => area.id).sort();
  return !sameItems(ids(initial), ids(current));
}

export function existingImagesChanged(
  initial: NpoProfileValues,
  current: NpoProfileValues,
): boolean {
  return !sameItems(initial.existingImages, current.existingImages);
}

/** Includes a stored value as an option even when it is not one of the presets. */
export function withCurrentOption(options: readonly string[], current: string): string[] {
  return current && !options.includes(current) ? [current, ...options] : [...options];
}

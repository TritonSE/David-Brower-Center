import Image from "next/image";
import { useMemo } from "react";

import RelationshipViewCard, {
  type RelatedNpo,
  type RelationshipTier,
} from "../app/components/RelationshipViewCard";

import { LeafIcon, LocationIcon, MoneyIcon, PeopleIcon } from "./icons/AppIcons";

import type {
  OrganizationListItem,
  OrganizationRelationship,
  OrganizationRelationshipTier,
} from "@/api/organization";
import type { ReactElement } from "react";

import { useOrganizations } from "@/contexts/OrganizationsContext";

const TIER_BY_BACKEND: Record<OrganizationRelationshipTier, RelationshipTier> = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  TERTIARY: "tertiary",
};

const EMPTY_TIERED_NPOS: Record<RelationshipTier, RelatedNpo[]> = {
  primary: [],
  secondary: [],
  tertiary: [],
};

function organizationToRelatedNpo(organization: OrganizationListItem): RelatedNpo {
  return {
    id: organization.id,
    name: organization.name,
    sizeLabel: organization.size,
    budgetLabel: organization.budget,
    locationLabel: organization.location,
    tags: organization.tags.map((tag) => tag.name),
    logoUrl: organization.images[0],
  };
}

function buildRelatedNposByTier(
  organizationId: string,
  organizations: OrganizationListItem[],
  relationships: OrganizationRelationship[],
): Record<RelationshipTier, RelatedNpo[]> {
  const orgsById = new Map(organizations.map((organization) => [organization.id, organization]));
  const seenByTier: Record<RelationshipTier, Set<string>> = {
    primary: new Set(),
    secondary: new Set(),
    tertiary: new Set(),
  };
  const result: Record<RelationshipTier, RelatedNpo[]> = {
    primary: [],
    secondary: [],
    tertiary: [],
  };

  for (const relationship of relationships) {
    const partnerId =
      relationship.npo1Id === organizationId
        ? relationship.npo2Id
        : relationship.npo2Id === organizationId
          ? relationship.npo1Id
          : null;
    if (!partnerId || partnerId === organizationId) continue;

    const tier = TIER_BY_BACKEND[relationship.relationshipTier];
    if (seenByTier[tier].has(partnerId)) continue;

    const partner = orgsById.get(partnerId);
    if (!partner) continue;

    seenByTier[tier].add(partnerId);
    result[tier].push(organizationToRelatedNpo(partner));
  }

  return result;
}

type Tag = {
  icon: ReactElement;
  label: string;
};

type NpoProfileCardProps = {
  organizationId?: string;
  name: string;
  tags: Tag[];
  description: string;
  mission: string;
  images: {
    primary: string;
    secondary: string;
    morePreview: string;
  };
  moreCountLabel: string;
  onClose?: () => void;
};

export function getNpoProfileCardImageProps(
  images: string[],
): Partial<Pick<NpoProfileCardProps, "images" | "moreCountLabel">> {
  const primary = images[0] ?? "";
  const secondary = images[1] ?? "";
  const morePreview = images[2] ?? "";
  const remainingImageCount = images.length - 3;

  return {
    images: {
      primary,
      secondary,
      morePreview,
    },
    moreCountLabel: remainingImageCount > 0 ? `+ ${remainingImageCount} More` : "",
  };
}

const imgPrimary = "/images/dbc-primary.svg";
const imgSecondary = "/images/dbc-secondary.svg";
const imgMorePreview = "/images/dbc-more-preview.svg";

function ImagePlaceholder() {
  return (
    <div
      aria-hidden
      className="flex h-full w-full items-center justify-center bg-[#e5e5e5] font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[12px] font-normal text-[#6c6c6c]"
    >
      No image
    </div>
  );
}

const defaultContent: NpoProfileCardProps = {
  name: "David Brower Center",
  tags: [
    {
      icon: <LeafIcon className="h-[18px] w-[18px] text-[#6c6c6c]" />,
      label: "Environmental",
    },
    { icon: <PeopleIcon className="h-4 w-4 text-[#6c6c6c]" />, label: "Mid Sized" },
    { icon: <MoneyIcon className="h-[14px] w-[14px] text-[#6c6c6c]" />, label: "100k" },
    {
      icon: <LocationIcon className="h-[14px] w-[14px] text-[#6c6c6c]" />,
      label: "Berkeley, CA",
    },
  ],
  description:
    "The David Brower Center is a nonprofit environmental hub and event venue in downtown Berkeley that houses green organizations, art galleries, and meeting spaces dedicated to sustainability and social justice. Named for environmentalist David Brower, it serves as a home for the environmental movement by hosting exhibitions, educational programs, and offices for mission-aligned nonprofits.",
  mission:
    "The David Brower Center’s mission is to be a home for the environmental movement by informing, inspiring, and connecting people to advance social equity and ecological sustainability. It does this through art and education programs, housing mission-aligned resident organizations, and hosting low-waste, green events that bring together nonprofits, social entrepreneurs, artists, activists, and the public.",
  images: {
    primary: imgPrimary,
    secondary: imgSecondary,
    morePreview: imgMorePreview,
  },
  moreCountLabel: "+ 4 More",
};

export function NpoProfileCard(props: Partial<NpoProfileCardProps>) {
  const content: NpoProfileCardProps = {
    ...defaultContent,
    ...props,
    tags: props.tags ?? defaultContent.tags,
    images: {
      ...defaultContent.images,
      ...props.images,
    },
  };

  const {
    organizations,
    relationships,
    isLoading: areOrganizationsLoading,
    error: organizationsError,
  } = useOrganizations();

  const relatedNposByTier = useMemo(() => {
    if (!content.organizationId) return EMPTY_TIERED_NPOS;
    return buildRelatedNposByTier(content.organizationId, organizations, relationships);
  }, [content.organizationId, organizations, relationships]);

  return (
    <section className="relative w-full max-w-[600px] rounded-[30px] border border-[#d9d9d9] bg-[#f5f5f5] px-5 pb-5 pt-6 sm:px-[28px] sm:pt-[27px]">
      {content.onClose && (
        <button
          type="button"
          aria-label="Close"
          onClick={content.onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#6c6c6c] transition-colors hover:bg-black/10 hover:text-black"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      <h1 className="font-[var(--font-proxima)] text-[28px]/[normal] font-bold text-black sm:text-[32px]">
        {content.name}
      </h1>

      <div className="mt-[8px] flex flex-wrap items-center gap-x-[6px] gap-y-1">
        {content.tags.map((tag, index) => (
          <div key={`${index}-${tag.label}`} className="flex items-center gap-[6px]">
            <div className="flex items-center gap-1 rounded-[12px] bg-transparent py-1 pr-2">
              {tag.icon}
              <span className="font-[var(--font-rubik)] text-xs font-normal leading-6 tracking-[0.24px] text-[#6c6c6c]">
                {tag.label}
              </span>
            </div>
            {index < content.tags.length - 1 ? (
              <span className="h-[3px] w-[3px] rounded-full bg-[#b4b4b4]" />
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-[10px] flex w-full flex-col gap-[10px] sm:h-[240px] sm:flex-row">
        <div className="h-[220px] w-full overflow-hidden rounded-[12px] sm:h-[240px] sm:w-[369px]">
          {content.images.primary ? (
            <Image
              alt={`Photo of ${content.name}`}
              src={content.images.primary}
              width={738}
              height={480}
              sizes="(min-width: 640px) 369px, 100vw"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlaceholder />
          )}
        </div>

        <div className="flex w-full flex-row gap-[10px] sm:w-[159px] sm:flex-col">
          <div className="h-[124px] w-1/2 overflow-hidden rounded-[12px] sm:h-[144px] sm:w-[159px]">
            {content.images.secondary ? (
              <Image
                alt={`Photo of ${content.name}`}
                src={content.images.secondary}
                width={318}
                height={288}
                sizes="(min-width: 640px) 159px, 50vw"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImagePlaceholder />
            )}
          </div>

          <div className="relative h-[124px] w-1/2 overflow-hidden rounded-[12px] sm:h-[86px] sm:w-[159px]">
            {content.images.morePreview ? (
              <Image
                alt={`Photo of ${content.name}`}
                src={content.images.morePreview}
                width={318}
                height={172}
                sizes="(min-width: 640px) 159px, 50vw"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImagePlaceholder />
            )}
            {content.moreCountLabel ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="font-[var(--font-proxima)] text-[15px]/[normal] font-normal text-white">
                  {content.moreCountLabel}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-[12px] space-y-[10px]">
        <div>
          <h2 className="font-[var(--font-proxima)] text-[16px]/[normal] font-bold text-black">
            Description
          </h2>
          <p className="mt-1 font-[var(--font-proxima)] text-[14px]/[normal] font-normal text-[#484848]">
            {content.description}
          </p>
        </div>

        <div>
          <h2 className="font-[var(--font-proxima)] text-[16px]/[normal] font-bold text-black">
            Mission
          </h2>
          <p className="mt-1 font-[var(--font-proxima)] text-[14px]/[normal] font-normal text-[#484848]">
            {content.mission}
          </p>
        </div>
      </div>

      <hr className="my-[20px] border-t border-[#d9d9d9]" />

      <RelationshipViewCard
        organizationsByTier={relatedNposByTier}
        isLoading={Boolean(content.organizationId) && areOrganizationsLoading}
        errorMessage={content.organizationId ? organizationsError : null}
      />
    </section>
  );
}

export default NpoProfileCard;

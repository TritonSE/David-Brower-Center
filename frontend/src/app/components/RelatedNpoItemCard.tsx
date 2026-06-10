import type { RelatedNpo } from "./RelationshipViewCard";

type RelatedNpoItemCardProps = {
  organization: RelatedNpo;
};

const defaultLogoSrc = "https://www.figma.com/api/mcp/asset/1dd87fb9-b5ff-4049-9cdb-2628ae104461";
const sizeIcon = "https://www.figma.com/api/mcp/asset/9b0634fb-fbe0-4f5b-94af-4fb7408230cd";
const budgetIcon = "https://www.figma.com/api/mcp/asset/74b93a0e-31b0-4ede-9c6e-215e2011223d";
const locationIcon = "https://www.figma.com/api/mcp/asset/6ff56856-45d1-4429-9eed-c14cc62ac028";

function tagClassName(tag: string) {
  const normalizedTag = tag.toLowerCase();

  if (normalizedTag.includes("technology")) {
    return "bg-[rgba(82,155,216,0.25)] text-[#3a7fb9]";
  }

  if (normalizedTag.includes("transport")) {
    return "bg-[rgba(117,135,191,0.2)] text-[#7587bf]";
  }

  if (normalizedTag.includes("social") || normalizedTag.includes("government")) {
    return "bg-[rgba(161,120,171,0.2)] text-[#a178ab]";
  }

  if (normalizedTag.includes("environment")) {
    return "bg-[rgba(103,152,104,0.2)] text-[#679868]";
  }

  return "bg-[#e5e5e5] text-[#6c6c6c]";
}

export default function RelatedNpoItemCard({ organization }: RelatedNpoItemCardProps) {
  const visibleTags = organization.tags.slice(0, 2);

  return (
    <article className="w-full rounded-[8px] border border-[#d9d9d9] bg-white px-4 py-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-[15px]">
          <div className="h-[54px] w-[54px] shrink-0 overflow-hidden rounded-[8px] bg-[#f3f3f3]">
            <img
              alt={`${organization.name} logo`}
              src={organization.logoUrl ?? defaultLogoSrc}
              className="h-full w-full object-cover"
            />
          </div>
          <h4 className="min-w-0 flex-1 font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[20px]/[normal] font-semibold text-black">
            {organization.name}
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-x-[6px] gap-y-[2px]">
          <div className="flex items-center gap-1 py-1 pr-1">
            <img alt="" src={sizeIcon} className="h-2 w-[12.571px]" />
            <span className="font-['Rubik',Arial,sans-serif] text-xs leading-6 tracking-[0.24px] text-[#6c6c6c]">
              {organization.sizeLabel}
            </span>
          </div>
          <span className="h-[3px] w-[3px] rounded-full bg-[#b4b4b4]" />
          <div className="flex items-center gap-1 p-1">
            <img alt="" src={budgetIcon} className="h-2 w-[4.444px]" />
            <span className="font-['Rubik',Arial,sans-serif] text-xs leading-6 tracking-[0.24px] text-[#6c6c6c]">
              {organization.budgetLabel}
            </span>
          </div>
          <span className="h-[3px] w-[3px] rounded-full bg-[#b4b4b4]" />
          <div className="flex items-center gap-1 p-1">
            <img alt="" src={locationIcon} className="h-2 w-[5.6px]" />
            <span className="font-['Rubik',Arial,sans-serif] text-xs leading-6 tracking-[0.24px] text-[#6c6c6c]">
              {organization.locationLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {visibleTags.map((tag) => (
            <span
              key={`${organization.id}-${tag}`}
              className={`rounded-[8px] px-2 py-1 font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-base/[normal] font-semibold ${tagClassName(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

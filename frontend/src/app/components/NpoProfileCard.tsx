type Tag = {
  iconSrc: string;
  iconAlt: string;
  label: string;
  iconClassName?: string;
};

type NpoProfileCardProps = {
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
  previousLabel: string;
  nextLabel: string;
};

const imgPrimary = "https://www.figma.com/api/mcp/asset/d6d6e1bd-a1df-4ba1-b3cb-c8f40aa0df46";
const imgSecondary = "https://www.figma.com/api/mcp/asset/2321c6d3-3a5d-4f97-b975-46e05b51d8f8";
const imgMorePreview = "https://www.figma.com/api/mcp/asset/fe060518-a76d-4f76-964e-30901647e9a7";
const imgEnvironmental = "https://www.figma.com/api/mcp/asset/cec0c0a0-7539-4e3f-95b9-a90b5a4803e7";
const imgPeople = "https://www.figma.com/api/mcp/asset/df189257-05b8-43ab-86b9-bfb40045ad6a";
const imgMoney = "https://www.figma.com/api/mcp/asset/df78feda-0560-4654-9591-1d9a7b72b517";
const imgLocation = "https://www.figma.com/api/mcp/asset/f80fd60b-8354-42f7-9239-d2a4cb6babc5";

const defaultContent: NpoProfileCardProps = {
  name: "David Brower Center",
  tags: [
    {
      iconSrc: imgEnvironmental,
      iconAlt: "Environmental",
      label: "Environmental",
      iconClassName: "h-[18px] w-[18px]",
    },
    { iconSrc: imgPeople, iconAlt: "Mid Sized", label: "Mid Sized", iconClassName: "h-4 w-4" },
    { iconSrc: imgMoney, iconAlt: "100k", label: "100k", iconClassName: "h-[14px] w-[14px]" },
    {
      iconSrc: imgLocation,
      iconAlt: "Berkeley, CA",
      label: "Berkeley, CA",
      iconClassName: "h-[14px] w-[14px]",
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
  previousLabel: "Previous",
  nextLabel: "Next",
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

  return (
    <section className="w-full max-w-[600px] rounded-[30px] border border-[#d9d9d9] bg-[#f5f5f5] px-5 pb-5 pt-6 sm:px-[28px] sm:pt-[27px]">
      <h1 className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[28px]/[normal] font-bold text-black sm:text-[32px]">
        {content.name}
      </h1>

      <div className="mt-[8px] flex flex-wrap items-center gap-x-[6px] gap-y-1">
        {content.tags.map((tag, index) => (
          <div key={tag.label} className="flex items-center gap-[6px]">
            <div className="flex items-center gap-1 rounded-[12px] bg-transparent py-1 pr-2">
              <img alt={tag.iconAlt} src={tag.iconSrc} className={tag.iconClassName ?? "h-4 w-4"} />
              <span className="font-['Rubik',Arial,sans-serif] text-xs font-normal leading-6 tracking-[0.24px] text-[#6c6c6c]">
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
          <img
            alt="David Brower Center building"
            src={content.images.primary}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex w-full flex-row gap-[10px] sm:w-[159px] sm:flex-col">
          <div className="h-[124px] w-1/2 overflow-hidden rounded-[12px] sm:h-[144px] sm:w-[159px]">
            <img
              alt="David Brower Center interior"
              src={content.images.secondary}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="relative h-[124px] w-1/2 overflow-hidden rounded-[12px] sm:h-[86px] sm:w-[159px]">
            <img
              alt="Additional gallery images"
              src={content.images.morePreview}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[15px]/[normal] font-normal text-white">
                {content.moreCountLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[12px] space-y-[10px]">
        <div>
          <h2 className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[16px]/[normal] font-bold text-black">
            Description
          </h2>
          <p className="mt-1 font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[14px]/[normal] font-normal text-[#484848]">
            {content.description}
          </p>
        </div>

        <div>
          <h2 className="font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[16px]/[normal] font-bold text-black">
            Mission
          </h2>
          <p className="mt-1 font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[14px]/[normal] font-normal text-[#484848]">
            {content.mission}
          </p>
        </div>
      </div>

      <div className="mt-[14px] flex items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-[40px] border border-[#d9d9d9] bg-white px-6 py-1 font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[16px]/[32px] font-normal text-[#3b9a9a]"
        >
          {content.previousLabel}
        </button>

        <button
          type="button"
          className="rounded-[40px] bg-[#3b9a9a] px-6 py-1 font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[16px]/[32px] font-normal text-white"
        >
          {content.nextLabel}
        </button>
      </div>
    </section>
  );
}

export default NpoProfileCard;

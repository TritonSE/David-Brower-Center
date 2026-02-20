import Image from "next/image";

import { LeafIcon, LocationIcon, MoneyIcon, PeopleIcon } from "./icons/AppIcons";

import type { ReactElement } from "react";

type Tag = {
  icon: ReactElement;
  label: string;
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

const imgPrimary = "/images/dbc-primary.svg";
const imgSecondary = "/images/dbc-secondary.svg";
const imgMorePreview = "/images/dbc-more-preview.svg";

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
              {tag.icon}
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
          <Image
            alt="David Brower Center building"
            src={content.images.primary}
            width={738}
            height={480}
            sizes="(min-width: 640px) 369px, 100vw"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex w-full flex-row gap-[10px] sm:w-[159px] sm:flex-col">
          <div className="h-[124px] w-1/2 overflow-hidden rounded-[12px] sm:h-[144px] sm:w-[159px]">
            <Image
              alt="David Brower Center interior"
              src={content.images.secondary}
              width={318}
              height={288}
              sizes="(min-width: 640px) 159px, 50vw"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="relative h-[124px] w-1/2 overflow-hidden rounded-[12px] sm:h-[86px] sm:w-[159px]">
            <Image
              alt="Additional gallery images"
              src={content.images.morePreview}
              width={318}
              height={172}
              sizes="(min-width: 640px) 159px, 50vw"
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

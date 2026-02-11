import Image from "next/image";

type Tag = {
  iconSrc: string;
  label: string;
};

type Section = {
  title: string;
  paragraphs: string[];
};

type NpoProfileCardProps = {
  name: string;
  tags: ReadonlyArray<Tag>;
  gallery: ReadonlyArray<string>;
  sections: ReadonlyArray<Section>;
};

const tagIconEnvironmental =
  "https://www.figma.com/api/mcp/asset/ca9189f4-b7cc-4829-aba5-ca0a5f187c63";
const tagIconPeople = "https://www.figma.com/api/mcp/asset/12dc4428-fdae-413c-b197-aa5c28ed3003";
const tagIconMoney = "https://www.figma.com/api/mcp/asset/617eab0e-129e-4a76-9b50-9075ae8e634b";
const tagIconLocation = "https://www.figma.com/api/mcp/asset/fd5607d5-7878-4e73-9008-8e6223c9c745";
const galleryImage = "https://www.figma.com/api/mcp/asset/8dc38a9d-c505-46b1-ab62-5ed999b5e1aa";

const defaultContent: NpoProfileCardProps = {
  name: "David Brower Center",
  tags: [
    { iconSrc: tagIconEnvironmental, label: "Environmental" },
    { iconSrc: tagIconPeople, label: "Mid Sized" },
    { iconSrc: tagIconMoney, label: "100k" },
    { iconSrc: tagIconLocation, label: "Berkeley, CA" },
  ],
  gallery: [galleryImage, galleryImage, galleryImage],
  sections: [
    {
      title: "Description",
      paragraphs: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aut",
      ],
    },
    {
      title: "Mission",
      paragraphs: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aut",
      ],
    },
  ],
};

export function NpoProfileCard(props: Partial<NpoProfileCardProps>) {
  const content: NpoProfileCardProps = {
    ...defaultContent,
    ...props,
    tags: props.tags ?? defaultContent.tags,
    gallery: props.gallery ?? defaultContent.gallery,
    sections: props.sections ?? defaultContent.sections,
  };

  return (
    <section className="w-full max-w-200 rounded-3xl border border-[#d9d9d9] bg-white px-5 pt-5 pb-4 shadow-[0_3px_10px_rgba(0,0,0,0.04)]">
      <header>
        <h1 className="text-[28px] font-bold leading-tight text-black">{content.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#1f1f1f]">
          {content.tags.map((tag, index) => (
            <div key={tag.label} className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-xl px-2 py-1.5">
                <Image
                  alt=""
                  src={tag.iconSrc}
                  className="h-4 w-4 object-contain"
                  width={16}
                  height={16}
                  unoptimized
                />
                <span className="leading-none tracking-[0.24px]">{tag.label}</span>
              </span>
              {index < content.tags.length - 1 ? (
                <span className="h-0.75 w-0.75 rounded-full bg-[#b4b4b4]" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>
      </header>

      <div className="mt-3 overflow-x-auto">
        <div className="flex min-w-max gap-2.5 pr-2">
          {content.gallery.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className="h-41 w-43 shrink-0 overflow-hidden rounded-xl bg-[#f2f2f2]"
            >
              <Image
                alt="Gallery image"
                src={src}
                className="h-full w-full object-cover"
                width={172}
                height={164}
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-4 text-[13px] text-[#1f1f1f]">
        {content.sections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h2 className="text-[15px] font-bold text-black">{section.title}</h2>
            {section.paragraphs.map((paragraph, idx) => (
              <p key={idx} className="leading-relaxed text-[#1f1f1f]">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export default NpoProfileCard;

export const DEFAULT_TAG_COLOR = "#D9D9D9";

export const TAG_COLORS: Record<string, string> = {
  "Climate Change Solutions": "#C2E5C0",
  "Community Resilience": "#F8DCC8",
  Conservation: "#D5E5C8",
  "Environmental Arts": "#D5C8F0",
  "Environmental Education": "#BFD8FB",
  "Environmental Justice": "#E2C8F0",
  "Indigenous Communities": "#F8C7B8",
  "International Initiatives": "#B6E5DC",
  "Oceans and Water": "#C8E8F0",
  "Pollution and Toxics": "#FCE8B2",
  "Sustainable Agriculture and Food Systems": "#FAD2B6",
  "Wildlife Protection": "#C8F0D8",
  "Women's Environmental Leadership": "#F8C8DC",
  "Youth Empowerment": "#FFE0B2",
};

export const FALLBACK_PALETTE = [
  "#BFD8FB",
  "#FAD2B6",
  "#E2C8F0",
  "#C2E5C0",
  "#F8C8DC",
  "#FCE8B2",
  "#B6E5DC",
  "#F8C7B8",
  "#D5C8F0",
  "#C8F0D8",
  "#C8E8F0",
  "#F8DCC8",
  "#D5E5C8",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getColorFor(tagName: string): string {
  const explicit = TAG_COLORS[tagName];
  if (explicit) return explicit;
  if (FALLBACK_PALETTE.length === 0) return DEFAULT_TAG_COLOR;
  return FALLBACK_PALETTE[hashString(tagName) % FALLBACK_PALETTE.length] ?? DEFAULT_TAG_COLOR;
}

/** Preset tag colors from Figma (Add Tag popup, node 3890:10202). */
export const PRESET_TAG_COLORS = [
  "#B07496",
  "#A178AB",
  "#8D7FB9",
  "#7587BF",
  "#5A8FBB",
  "#3B9A9A",
  "#4296AE",
  "#4C9B81",
  "#679868",
  "#829153",
  "#AC804C",
  "#B6785C",
  "#B97373",
] as const;

export const DEFAULT_TAG_COLOR = "#5A8FBB";

/** Text color for a tag pill whose background is the tag's stored color. */
export function getDarkerShade(hex: string): string {
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (expanded.length !== 6) return "#1f1f1f";

  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return "#1f1f1f";

  // Darken in HSL so we keep the hue and just drop lightness.
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;
  const delta = max - min;

  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / delta + 2;
        break;
      default:
        h = (rNorm - gNorm) / delta + 4;
    }
    h *= 60;
  }

  const targetL = Math.max(0.18, l - 0.55);
  const targetS = Math.min(1, s + 0.05);

  const hueToRgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  let outR = targetL;
  let outG = targetL;
  let outB = targetL;
  if (targetS !== 0) {
    const q = targetL < 0.5 ? targetL * (1 + targetS) : targetL + targetS - targetL * targetS;
    const p = 2 * targetL - q;
    const hh = h / 360;
    outR = hueToRgb(p, q, hh + 1 / 3);
    outG = hueToRgb(p, q, hh);
    outB = hueToRgb(p, q, hh - 1 / 3);
  }

  const toHex = (v: number): string =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(outR)}${toHex(outG)}${toHex(outB)}`;
}

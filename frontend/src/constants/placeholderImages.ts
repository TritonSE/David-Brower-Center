/**
 * Stand-in artwork for organizations that have no uploaded images yet.
 *
 * The variant is picked from a hash of the organization id so a given org keeps
 * the same artwork across renders, routes, and reloads — without storing
 * anything. Swapping these out for real photos only requires populating
 * `Organization.images`; nothing here needs to change.
 */

const PLACEHOLDER_VARIANT_COUNT = 6;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function variantIndex(seed: string, offset: number): number {
  if (!seed) return offset % PLACEHOLDER_VARIANT_COUNT;
  return (hashSeed(seed) + offset) % PLACEHOLDER_VARIANT_COUNT;
}

/** Wide artwork used for the photo slots on the profile card. */
export function getPlaceholderImage(seed: string, offset = 0): string {
  return `/images/placeholders/npo-${(variantIndex(seed, offset) + 1).toString()}.svg`;
}

/** Square mark used where an organization logo is shown. */
export function getPlaceholderLogo(seed: string): string {
  return `/images/placeholders/logo-${(variantIndex(seed, 0) + 1).toString()}.svg`;
}

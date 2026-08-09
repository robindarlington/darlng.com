/**
 * Shared image parameters for the homepage hero. Consumed by BOTH the LCP
 * preload `getImage` call and the hero `<Picture>` in `index.astro` so the
 * two can never drift apart — a mismatch between them means the preloaded
 * URL doesn't match the `<picture>`'s actual `srcset` candidate, which
 * causes the browser to download the hero image twice.
 */
export const HERO_IMAGE_PARAMS = {
  widths: [480, 640, 750, 960, 1254],
  quality: 55,
  fit: 'cover' as const,
};

export const PRODUCT_IMAGE_FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#eef0f3" width="100%" height="100%"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#9aa3ad" font-size="15" font-family="system-ui,sans-serif">אין תמונה</text></svg>`
  );

export function resolveProductImageSrc(imageLink, imageMap, { allowEmpty = false } = {}) {
  const raw = typeof imageLink === "string" ? imageLink.trim() : "";
  if (!raw) {
    return allowEmpty ? "" : PRODUCT_IMAGE_FALLBACK;
  }
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  const mapped = imageMap?.[raw];
  return mapped || PRODUCT_IMAGE_FALLBACK;
}

export const CART_LINE_SEP = "|||";

export function encodeCartLineKey(productId, size, variantKey) {
  if (!productId) return "";
  const s = (size ?? "").trim();
  const v = (variantKey ?? "default").trim();
  return `${productId}${CART_LINE_SEP}${s}${CART_LINE_SEP}${v}`;
}

export function parseCartLineKey(key) {
  if (typeof key !== "string" || !key.includes(CART_LINE_SEP)) {
    return {
      productId: key || "",
      size: "",
      variantKey: "default",
    };
  }
  const parts = key.split(CART_LINE_SEP);
  const productId = parts[0] ?? "";
  const size = parts[1] ?? "";
  const variantKey = parts[2]?.length ? parts[2] : "default";
  return { productId, size, variantKey };
}

const VARIANT_KEY_LABELS_HE = {
  dusk: "גוון עמוק",
  glacier: "טון קר ובהיר",
  sand: "גוון חם",
};

export function variantDisplayHe(variantKey) {
  if (!variantKey || variantKey === "default") return "—";
  return VARIANT_KEY_LABELS_HE[variantKey] || variantKey;
}

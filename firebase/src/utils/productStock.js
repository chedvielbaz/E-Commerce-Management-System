import { STANDARD_SIZES } from "../constants/sizes";

export function normalizeSizeStock(raw) {
  const obj = {};
  for (const s of STANDARD_SIZES) obj[s] = Math.max(0, Number(raw?.[s]) || 0);
  return obj;
}

export function sumSizeStock(stockObj) {
  const n = normalizeSizeStock(stockObj);
  return STANDARD_SIZES.reduce((acc, s) => acc + n[s], 0);
}

export function hasStructuredSizeStock(product) {
  const n = normalizeSizeStock(product?.sizeStock);
  return STANDARD_SIZES.some((s) => n[s] > 0);
}

export function sizesOffered(product) {
  if (hasStructuredSizeStock(product)) {
    return STANDARD_SIZES.filter((s) => normalizeSizeStock(product.sizeStock)[s] > 0);
  }
  const legacy = Number(product?.quantity);
  return legacy > 0 ? [...STANDARD_SIZES] : [];
}

export function stockForSize(product, size) {
  if (hasStructuredSizeStock(product)) {
    return normalizeSizeStock(product.sizeStock)[size] ?? 0;
  }
  return Math.max(0, Number(product?.quantity) || 0);
}

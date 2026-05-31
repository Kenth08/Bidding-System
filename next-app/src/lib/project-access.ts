/**
 * Check if a supplier can access a project based on business type matching.
 * Comparison is case-insensitive and trims whitespace.
 *
 * When projectBusinessTypes is empty but openToAll is false, falls back to
 * matching against procurementType (the project category).
 */
export function canSupplierAccessProject(
  supplierBusinessTypes: string[],
  projectBusinessTypes: string[],
  openToAll: boolean,
  procurementType?: string
): boolean {
  if (openToAll) return true;
  if (!supplierBusinessTypes.length) return false;

  const normalize = (value: string) => String(value || "").trim().toLowerCase();
  const supplierSet = new Set(supplierBusinessTypes.map(normalize).filter(Boolean));

  // Use explicit project business types if available
  const effectiveProjectTypes = projectBusinessTypes.filter(Boolean);
  if (effectiveProjectTypes.length > 0) {
    return effectiveProjectTypes
      .map(normalize)
      .filter(Boolean)
      .some((projectType) => supplierSet.has(projectType));
  }

  // Fallback: match against procurement_type when no explicit business types set
  if (procurementType) {
    return supplierSet.has(normalize(procurementType));
  }

  return false;
}

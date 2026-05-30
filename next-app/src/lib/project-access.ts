/**
 * Check if a supplier can access a project based on business type matching.
 * Comparison is case-insensitive and trims whitespace.
 */
export function canSupplierAccessProject(
  supplierBusinessTypes: string[],
  projectBusinessTypes: string[],
  openToAll: boolean
): boolean {
  if (openToAll) return true;
  if (!supplierBusinessTypes.length) return false;
  if (!projectBusinessTypes.length) return false;

  const normalize = (value: string) => String(value || "").trim().toLowerCase();
  const supplierSet = new Set(supplierBusinessTypes.map(normalize).filter(Boolean));
  return projectBusinessTypes
    .map(normalize)
    .filter(Boolean)
    .some((projectType) => supplierSet.has(projectType));
}

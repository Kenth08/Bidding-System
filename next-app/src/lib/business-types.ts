export const BUSINESS_TYPES = [
  "IT Equipment",
  "Office Supplies",
  "Construction Materials",
  "Medical Supplies",
  "ICT Services",
  "Electrical Supplies",
  "Furniture and Fixtures",
  "Janitorial Supplies",
  "Food and Catering Services",
  "Printing Services",
  "Repair and Maintenance Services",
  "Security Services",
  "Transportation Services",
  "Agricultural Supplies",
  "Other",
] as const;

export type BusinessTypeName = (typeof BUSINESS_TYPES)[number];

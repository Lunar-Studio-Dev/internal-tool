export const CONTACT_ROLE_ORDER = ["OWNER", "MANAGER", "CTO", "OTHER"] as const;

export const CONTACT_ROLE_LABELS: Record<
  (typeof CONTACT_ROLE_ORDER)[number],
  string
> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  CTO: "CTO",
  OTHER: "Other",
};

/** Seeded source category names — must match migration seed rows. */
export const SOURCE_CATEGORY_NAMES = {
  CLUB: "Club",
  EXISTING_CLIENT: "Existing client",
  EXTERNAL: "External",
} as const;

export type SourceCategoryName =
  (typeof SOURCE_CATEGORY_NAMES)[keyof typeof SOURCE_CATEGORY_NAMES];

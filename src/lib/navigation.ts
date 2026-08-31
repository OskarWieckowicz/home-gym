export const CREATOR_START_MODES = ["demo", "new"] as const;

export type CreatorStartMode = (typeof CREATOR_START_MODES)[number];

export function parseCreatorStartMode(value: unknown): CreatorStartMode | null {
  return value === "demo" || value === "new" ? value : null;
}

export type SiteLink = {
  readonly label: string;
  readonly href: string;
};

export const routes = {
  home: "/",
  catalog: "/catalog",
  creator: "/creator",
  summary: "/summary",
} as const;

/**
 * `demo` loads a prepared room and layout, `new` opens an empty project with
 * the configuration panel. Start actions are consumed once; refresh resumes
 * the resulting project instead of discarding edits.
 */
export function creatorRoute(start: CreatorStartMode) {
  return `${routes.creator}?start=${start}` as const;
}

export function productRoute(slug: string) {
  return `${routes.catalog}/${slug}` as const;
}

/** A product intent opens existing placement controls; it never adds a purchase. */
export function creatorProductRoute(productId: string) {
  return `${routes.creator}?product=${encodeURIComponent(productId)}` as const;
}

export const siteLinks = {
  logo: { label: "Home Gym Creator", href: routes.home },
  catalog: { label: "Catalog", href: routes.catalog },
  openCreator: { label: "Open creator", href: routes.creator },
  viewSummary: { label: "View summary", href: routes.summary },
  backToEditing: { label: "Back to editing", href: routes.creator },
  runDemo: { label: "Explore sample project", href: creatorRoute("demo") },
  startEmpty: { label: "Start planning", href: creatorRoute("new") },
  openSampleProject: {
    label: "Open this project",
    href: creatorRoute("demo"),
  },
  designMyGym: { label: "Design my gym", href: creatorRoute("new") },
} as const satisfies Record<string, SiteLink>;

export const headerLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Agent guide", href: "/#agent-guide" },
  siteLinks.catalog,
] as const satisfies readonly SiteLink[];

export const footerLinks = [
  siteLinks.catalog,
  siteLinks.openCreator,
] as const satisfies readonly SiteLink[];

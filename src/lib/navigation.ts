export const CREATOR_START_MODES = ["demo", "new"] as const;

export type CreatorStartMode = (typeof CREATOR_START_MODES)[number];

export type SiteLink = {
  readonly label: string;
  readonly href: string;
};

export const routes = {
  home: "/",
  catalog: "/catalog",
  creator: "/creator",
} as const;

/**
 * `demo` loads a prepared room and layout, `new` opens an empty project with
 * the configuration panel. The editor reads the mode from the query string, so
 * both intents survive a direct visit or a page refresh.
 */
export function creatorRoute(start: CreatorStartMode) {
  return `${routes.creator}?start=${start}` as const;
}

export function productRoute(slug: string) {
  return `${routes.catalog}/${slug}` as const;
}

export const siteLinks = {
  logo: { label: "Home Gym Creator", href: routes.home },
  catalog: { label: "Catalog", href: routes.catalog },
  openCreator: { label: "Open creator", href: creatorRoute("new") },
  runDemo: { label: "Run the sample project", href: creatorRoute("demo") },
  startEmpty: { label: "Start from an empty room", href: creatorRoute("new") },
  openSampleProject: {
    label: "Open this project",
    href: creatorRoute("demo"),
  },
  designMyGym: { label: "Design my gym", href: creatorRoute("new") },
} as const satisfies Record<string, SiteLink>;

export const headerLinks = [
  { label: "How it works", href: routes.home },
  { label: "Creator", href: creatorRoute("new") },
  siteLinks.catalog,
] as const satisfies readonly SiteLink[];

export const footerLinks = [
  siteLinks.catalog,
  siteLinks.openCreator,
] as const satisfies readonly SiteLink[];

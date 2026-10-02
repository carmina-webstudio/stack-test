// Business facts for this site, in one place. Page text, JSON-LD schema, head tags (title,
// description, canonical, Open Graph), sitemap.xml and the robots.txt "Sitemap:" line all
// read from here, so they can't drift apart. For a new client, edit this file first.
//
// Keep this file plain data: no imports, no enums, only type annotations that can be erased.
// The site check (scripts/site-check.ts) loads it straight into Node with type stripping, and
// the browser tests (tests/) read their expected values from it.
//
// Only use facts the client has given. A value that isn't filled in yet reads
// "[PLACEHOLDER: what's needed]": it's left out of the schema and head tags automatically
// (never invent it), `npm run check` lists it, and it blocks going live.
// An empty value ("" or []) means "the client doesn't have / doesn't want this".

export type Service = { name: string; description: string };
export type Faq = { q: string; a: string };

/** One opening-hours rule, e.g. { days: ["Monday", "Friday"], opens: "08:00", closes: "17:00" }. */
export type OpeningHours = {
  days: ("Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday")[];
  opens: string; // 24-hour "HH:MM"
  closes: string; // 24-hour "HH:MM"
};

/** A place the business serves. "City" for a town, "AdministrativeArea" for a county or region. */
export type ServiceArea = { type: "City" | "AdministrativeArea"; name: string };

/** The one placeholder marker, e.g. "[PLACEHOLDER: ZIP code]". */
export type Placeholder = `[PLACEHOLDER: ${string}]`;

export function isPlaceholder(value: unknown): value is Placeholder {
  return typeof value === "string" && value.startsWith("[PLACEHOLDER:");
}

/** The value, or "" while it's still a placeholder (so it's left out of the page). */
export function filled(value: string): string {
  return isPlaceholder(value) ? "" : value;
}

export const business = {
  // "spec": a preview for the client. Every page is noindex, placeholders are warnings.
  // "live": the real site on the client's domain. Public pages are indexable, and the site check
  // fails on any placeholder, test data, *.netlify.app address or the placeholder favicon.
  siteStatus: "spec" as "spec" | "live",

  name: "Test Landscaping Co",
  // schema.org type. Use a more specific one when it fits the client (e.g. "Plumber",
  // "Electrician", "RoofingContractor", "HVACBusiness"); "LocalBusiness" is always valid.
  schemaType: "LocalBusiness",
  // What they do, used in the home page heading and title: "<trade> in <city>, <region>".
  trade: "Landscaping",
  // One sentence: home page intro, home meta description and schema description.
  description: "Lawn care, garden design and yard cleanup for homes in Bothell and nearby cities.",

  phone: {
    href: "tel:+14255550100", // tel: link, +1 and digits only
    display: "(425) 555-0100", // how it reads on the page
    schema: "+1-425-555-0100", // international format for schema
  },

  address: {
    // "" for a service-area business that hides its address.
    streetAddress: "[PLACEHOLDER: street address, or empty if the client hides it]",
    city: "Bothell",
    region: "WA",
    regionName: "Washington",
    postalCode: "[PLACEHOLDER: ZIP code]",
    country: "US",
  },

  // Short line for the footer, and the places listed in the schema.
  areaServed: {
    summary: "Bothell, WA and nearby cities",
    places: [
      { type: "City", name: "Bothell, WA" },
      { type: "AdministrativeArea", name: "King County, WA" },
      { type: "AdministrativeArea", name: "Snohomish County, WA" },
    ] satisfies ServiceArea[],
  },

  services: [
    { name: "Lawn Care", description: "Regular mowing, edging and seasonal lawn treatments." },
    {
      name: "Garden Design",
      description: "Planting plans and new garden beds that fit your yard.",
    },
    { name: "Yard Cleanup", description: "Leaf removal, pruning and debris hauling." },
  ] satisfies Service[],

  // The client's opening hours. Left out of the schema while a placeholder or empty.
  hours: "[PLACEHOLDER: opening hours, e.g. Mon-Fri 8:00-17:00]" as OpeningHours[] | Placeholder,

  // Live address of the site, no trailing slash. Change this when the client's domain goes live:
  // canonical tags, Open Graph URLs, schema, sitemap.xml and robots.txt all follow.
  siteUrl: "https://webstudio-stack-test.netlify.app",

  // Paths inside public/. logo: the client's logo (a square PNG of at least 112x112 is best
  // for Google; the favicon is the stand-in until the client sends one).
  logo: "/favicon.svg",
  // 1200x630 image for link previews (a photo of the client's real work, or their logo on a
  // brand-color background), e.g. "/share.jpg". Left out while a placeholder.
  shareImage: "[PLACEHOLDER: 1200x630 share image in public/, e.g. /share.jpg]",

  // The client's profile links (Google Business Profile, Facebook, Yelp, ...).
  // Left out of the schema while a placeholder or empty.
  sameAs: "[PLACEHOLDER: Google Business Profile, Facebook, Yelp links]" as string[] | Placeholder,

  // Promises the client has confirmed in writing, e.g. "Licensed and insured", "No obligation".
  // The site check (L15) fails if a page makes a promise like these that isn't listed here.
  claims: [] as string[],

  // Questions and answers for the home page FAQ and its FAQPage schema. Only answers the client
  // has given.
  faqs: [
    {
      q: "What area do you serve?",
      a: "Bothell and nearby cities in King and Snohomish counties.",
    },
    { q: "Are estimates free?", a: "Yes, estimates are free." },
    {
      q: "How fast do you respond?",
      a: "We reply to quote requests within one business day.",
    },
  ] satisfies Faq[],
};

/** Absolute URL on this site, e.g. absoluteUrl("/quote"). */
export function absoluteUrl(path: string) {
  return `${business.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Pages that search engines may list: they get canonical + Open Graph tags and go in sitemap.xml. */
export const PUBLIC_PAGES = ["/", "/quote"] as const;
export type PublicPage = (typeof PUBLIC_PAGES)[number];

// Business facts for this site, in one place. Page text, JSON-LD schema, head tags (title,
// description, canonical, Open Graph), sitemap.xml and the robots.txt "Sitemap:" line all
// read from here, so they can't drift apart. For a new client, edit this file first.
//
// Only use facts the client has given. Anything marked PLACEHOLDER is not filled in yet:
// empty values are left out of the schema and head tags automatically (never invent them).

export type Service = { name: string; description: string };

/** One opening-hours rule, e.g. { days: ["Monday", "Friday"], opens: "08:00", closes: "17:00" }. */
export type OpeningHours = {
  days: ("Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday")[];
  opens: string; // 24-hour "HH:MM"
  closes: string; // 24-hour "HH:MM"
};

/** A place the business serves. "City" for a town, "AdministrativeArea" for a county or region. */
export type ServiceArea = { type: "City" | "AdministrativeArea"; name: string };

export const business = {
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
    streetAddress: "", // PLACEHOLDER: leave empty for a service-area business that hides it
    city: "Bothell",
    region: "WA",
    regionName: "Washington",
    postalCode: "", // PLACEHOLDER
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

  // PLACEHOLDER: the client's opening hours. Left out of the schema while empty.
  hours: [] as OpeningHours[],

  // Live address of the site, no trailing slash. Change this when the client's domain goes live:
  // canonical tags, Open Graph URLs, schema, sitemap.xml and robots.txt all follow.
  siteUrl: "https://webstudio-stack-test.netlify.app",

  // Paths inside public/. logo: the client's logo (a square PNG of at least 112x112 is best
  // for Google; the favicon is the stand-in until the client sends one).
  logo: "/favicon.svg",
  // PLACEHOLDER: 1200x630 image for link previews (a photo of the client's real work, or their
  // logo on a brand-color background), e.g. "/share.jpg". Left out while empty.
  shareImage: "",

  // PLACEHOLDER: the client's profile links (Google Business Profile, Facebook, Yelp, ...).
  // Left out of the schema while empty.
  sameAs: [] as string[],
};

/** Absolute URL on this site, e.g. absoluteUrl("/quote"). */
export function absoluteUrl(path: string) {
  return `${business.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Pages that search engines may list: they get canonical + Open Graph tags and go in sitemap.xml. */
export const PUBLIC_PAGES = ["/", "/quote"] as const;
export type PublicPage = (typeof PUBLIC_PAGES)[number];

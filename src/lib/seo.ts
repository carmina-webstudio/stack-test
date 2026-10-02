// Head tags and JSON-LD schema for every page, built from src/lib/business.ts.
// Values still marked as placeholders in business.ts are left out of tags and schema.

import { absoluteUrl, business, filled, type Faq, type PublicPage } from "@/lib/business";

/** While the site is a spec every page is noindex; once live, only public pages are indexable. */
function robotsContent(isPublic: boolean) {
  return business.siteStatus === "live" && isPublic
    ? "index, follow, max-image-preview:large"
    : "noindex, nofollow";
}

/** Absolute URL of the share image, or "" while it's a placeholder. */
function shareImageUrl() {
  const image = filled(business.shareImage);
  return image ? absoluteUrl(image) : "";
}

type PageHeadOptions = {
  /** Page title; " | <business name>" is added after it. */
  title: string;
  description: string;
  /** Public pages only: adds the canonical tag and Open Graph tags for this path. */
  path?: PublicPage;
  /** JSON-LD object(s) to pre-render into the page. */
  schema?: object;
};

/** Everything a route's `head` returns: title, description, canonical, Open Graph, schema. */
export function pageHead({ title, description, path, schema }: PageHeadOptions) {
  const fullTitle = `${title} | ${business.name}`;
  const meta: Record<string, string>[] = [
    { title: fullTitle },
    { name: "description", content: description },
    { name: "robots", content: robotsContent(Boolean(path)) },
  ];
  const links: { rel: string; href: string }[] = [];

  if (path) {
    const url = absoluteUrl(path);
    const image = shareImageUrl();
    links.push({ rel: "canonical", href: url });
    meta.push(
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: business.name },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    );
    // Only when a real 1200x630 share image is set in business.ts.
    if (image) {
      meta.push(
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: business.name },
        { name: "twitter:image", content: image },
      );
    }
  }

  return {
    meta,
    links,
    scripts: schema
      ? [{ type: "application/ld+json", children: JSON.stringify(schema) }]
      : undefined,
  };
}

const BUSINESS_ID = absoluteUrl("/#business");

/** LocalBusiness node. Empty or placeholder facts (street, postal code, hours, profiles) are
 * left out. */
export function localBusinessSchema() {
  const { address, hours, sameAs } = business;
  const streetAddress = filled(address.streetAddress);
  const postalCode = filled(address.postalCode);
  const logo = absoluteUrl(business.logo);
  return {
    "@type": business.schemaType,
    "@id": BUSINESS_ID,
    url: absoluteUrl("/"),
    name: business.name,
    description: business.description,
    telephone: business.phone.schema,
    image: shareImageUrl() || logo,
    logo,
    address: {
      "@type": "PostalAddress",
      ...(streetAddress && { streetAddress }),
      addressLocality: address.city,
      addressRegion: address.region,
      ...(postalCode && { postalCode }),
      addressCountry: address.country,
    },
    areaServed: areaServedSchema(),
    ...(Array.isArray(hours) &&
      hours.length > 0 && {
        openingHoursSpecification: hours.map((rule) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: rule.days.map((day) => `https://schema.org/${day}`),
          opens: rule.opens,
          closes: rule.closes,
        })),
      }),
    ...(Array.isArray(sameAs) && sameAs.length > 0 && { sameAs }),
  };
}

function areaServedSchema() {
  return business.areaServed.places.map((place) => ({ "@type": place.type, name: place.name }));
}

/** One Service node per service, each pointing back to the business. */
export function serviceSchemas() {
  return business.services.map((service) => ({
    "@type": "Service",
    name: service.name,
    serviceType: service.name,
    description: service.description,
    provider: { "@id": BUSINESS_ID },
    areaServed: areaServedSchema(),
  }));
}

/** FAQPage node from the same questions and answers the page shows. */
export function faqSchema(faqs: readonly Faq[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

/** Wraps schema nodes in one JSON-LD document. */
export function schemaGraph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

// What the tests expect on this site. Business facts (name, phone, services, FAQ, area) come
// from src/lib/business.ts; this file adds the site's structure: pages, navigation, homepage
// sections and the quote form.
//
// For a new client, change the data here and in business.ts, never the tests.
// Plain data, loadable by Node's type stripping (scripts/site-check.ts reads it too): no
// imports except business.ts, no enums.

import { business, PUBLIC_PAGES } from "../src/lib/business.ts";

export type PageConfig = {
  path: string;
  /** Short name used in screenshot file names and test titles. */
  name: string;
  /** The page's h1 (exact text, or a pattern when it changes, e.g. with the visitor's name). */
  h1: string | RegExp;
};

/** Every page on the site. Each one needs a route in src/routes and an entry in vite.config.ts. */
export const pages: PageConfig[] = [
  {
    path: "/",
    name: "home",
    h1: `${business.trade} in ${business.address.city}, ${business.address.region}`,
  },
  { path: "/quote", name: "quote", h1: "Get a Free Quote" },
  { path: "/thank-you", name: "thank-you", h1: /^Thanks, .*we got your request$/ },
  { path: "/404", name: "404", h1: "Page not found" },
];

/** Pages search engines may list (canonical, Open Graph, sitemap.xml). From business.ts. */
export const publicPages: readonly string[] = PUBLIC_PAGES;

export type NavItem = {
  label: string;
  /** "/page" for a page, "/#section-id" for a section of a page. */
  href: string;
  /** How the item reads in the phone/tablet menu, when it's different. */
  menuLabel?: string;
};

/** Header navigation, in order. Also shown in the footer. */
export const nav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "FAQ", href: "/#faq" },
  { label: "Get a Quote", href: "/quote", menuLabel: "Get a Free Quote" },
];

/** Screen width (px) from which the header shows its links instead of the menu button. */
export const desktopNavFrom = 1024;

/** The two main actions, as their buttons read. */
export const cta = {
  call: "Call Now",
  quote: "Get a Quote",
  /** The quote button or link's target page. */
  quotePath: "/quote",
};

export type HomeSection = {
  /** Heading text of the section (its accessible name). */
  heading: string;
  /** Section id, when navigation links to it ("/#services"). */
  id?: string;
};

/** Homepage sections, top to bottom. The first one is the hero. */
export const homeSections: HomeSection[] = [
  { heading: `${business.trade} in ${business.address.city}, ${business.address.region}` },
  { heading: "How it works" },
  { heading: "Services", id: "services" },
  { heading: "FAQ", id: "faq" },
];

/** Sections that show business.services and business.faqs. */
export const servicesSection = "Services";
export const faqSection = "FAQ";

export type FormField = {
  /** The field's name attribute (what Netlify receives). */
  name: string;
  /** Visible label text. */
  label: string;
  /** input type, or "select" / "textarea". */
  type: "text" | "tel" | "email" | "select" | "textarea";
  /** Expected autocomplete value ("" when it doesn't apply, e.g. a dropdown or message). */
  autocomplete: string;
  required: boolean;
  /** A valid value for the submit test. */
  valid: string;
  /** Optional: a wrong value and the error it should show. */
  invalid?: { value: string; error: RegExp };
  /** Optional: what the field shows while typing, e.g. "123456" → "(123) 456-". */
  asYouType?: { type: string; shows: string }[];
};

export const quoteForm = {
  path: "/quote",
  /** Netlify form name: the form's name attribute and its hidden form-name value. */
  name: "quote",
  /** Where the JavaScript submit posts (the static copy of the form, for Netlify). */
  endpoint: "/__forms.html",
  /** Static copy of the form that Netlify reads at deploy time. */
  staticCopy: "public/__forms.html",
  submitLabel: "Send Request",
  /** Hidden fields every submission carries. */
  hiddenFields: ["form-name", "bot-field", "subject"],
  /** Honeypot: people never see it; bots fill it in. */
  honeypot: "bot-field",
  /** Field whose values become the owner's email subject. */
  subject: "subject",
  /** Fields whose values must appear in the subject. */
  subjectIncludes: ["name", "phone", "service", "city"],
  /** The service dropdown and its empty first option. */
  serviceField: "service",
  servicePlaceholder: "Select a service",
  fields: [
    {
      name: "name",
      label: "Name",
      type: "text",
      autocomplete: "name",
      required: true,
      valid: "Test Person",
    },
    {
      name: "phone",
      label: "Phone",
      type: "tel",
      autocomplete: "tel",
      required: true,
      valid: "4255550123",
      invalid: { value: "425555", error: /10-digit/i },
      asYouType: [
        { type: "1", shows: "(1" },
        { type: "4", shows: "(4" },
        { type: "425", shows: "(425) " },
        { type: "123456", shows: "(123) 456-" },
        { type: "4255550123", shows: "(425) 555-0123" },
        { type: "+1 425 555 0123", shows: "(425) 555-0123" },
        { type: "42555501239", shows: "(425) 555-0123" },
      ],
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      autocomplete: "email",
      required: true,
      valid: "test@example.com",
      invalid: { value: "test@example", error: /email address/i },
    },
    {
      name: "city",
      label: "City",
      type: "text",
      autocomplete: "address-level2",
      required: true,
      valid: business.address.city,
    },
    {
      name: "service",
      label: "Service",
      type: "select",
      autocomplete: "",
      required: true,
      valid: business.services[0]?.name ?? "",
    },
    {
      name: "message",
      label: "Describe the job",
      type: "textarea",
      autocomplete: "",
      required: true,
      valid: "Weekly mowing for a small front lawn, starting next month.",
      // 9 characters: one under the 10-character minimum.
      invalid: { value: "Mow lawn.", error: /at least 10 characters/i },
    },
  ] satisfies FormField[] as FormField[],
};

export const thankYou = {
  path: "/thank-you",
  /** The line that says when the customer hears back. */
  replyLine: /within one business day/i,
  homeLink: "Back to home",
};

export const notFound = {
  path: "/404",
  message: /page not found/i,
  homeLink: "Go home",
};

/** Words that must never show on a page (leftovers, broken data). */
export const forbiddenText =
  /\bundefined\b|\bnull\b|\bNaN\b|\[object Object\]|\{\{|\}\}|lorem ipsum/i;

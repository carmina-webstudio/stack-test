import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ClipboardCheck,
  Flower2,
  Leaf,
  PhoneCall,
  Shovel,
  Sprout,
} from "lucide-react";
import { PHONE_DISPLAY, PHONE_HREF, SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { buttonVariants } from "@/components/ui/button";

const services = [
  {
    title: "Lawn Care",
    text: "Regular mowing, edging and seasonal lawn treatments.",
    icon: Sprout,
  },
  {
    title: "Garden Design",
    text: "Planting plans and new garden beds that fit your yard.",
    icon: Flower2,
  },
  { title: "Yard Cleanup", text: "Leaf removal, pruning and debris hauling.", icon: Leaf },
];

const steps = [
  {
    title: "Call or request a quote",
    text: "Tell us about your yard by phone or with the quote form.",
    icon: PhoneCall,
  },
  {
    title: "Get a free estimate",
    text: "We look at the job and give you a clear estimate, free.",
    icon: ClipboardCheck,
  },
  {
    title: "We get to work",
    text: "Once you approve, we schedule the work and get it done.",
    icon: Shovel,
  },
];

const faqs = [
  {
    q: "What area do you serve?",
    a: "Bothell and nearby cities in King and Snohomish counties.",
  },
  { q: "Are estimates free?", a: "Yes, estimates are free." },
  {
    q: "How fast do you respond?",
    a: "We reply to quote requests within one business day.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Test Landscaping Co",
    telephone: "+1-425-555-0100",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bothell",
      addressRegion: "WA",
      addressCountry: "US",
    },
    areaServed: "Bothell, WA and nearby cities",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Landscaping in Bothell, WA | Test Landscaping Co" },
      {
        name: "description",
        content:
          "Lawn care, garden design and yard cleanup for homes in Bothell and nearby cities.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Landscaping in Bothell, WA | Test Landscaping Co" },
      {
        property: "og:description",
        content:
          "Lawn care, garden design and yard cleanup for homes in Bothell and nearby cities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(jsonLd),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="hero-pattern relative overflow-hidden bg-hero text-primary-foreground">
          {/* Height follows the content (no full-screen sizing), so the next section always
              peeks in below and zooming out doesn't stretch the hero. */}
          <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-accent">
                Bothell, Washington
              </p>
              <h1 className="font-heading text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                Landscaping in Bothell, WA
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-primary-foreground/85 sm:text-xl">
                Lawn care, garden design and yard cleanup for homes in Bothell and nearby cities.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href={PHONE_HREF}
                  className={buttonVariants({
                    variant: "accent",
                    size: "lg",
                    className: "shadow-lg",
                  })}
                >
                  <PhoneCall aria-hidden="true" />
                  Call Now
                </a>
                <Link
                  to="/quote"
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className:
                      "border-primary-foreground/70 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary",
                  })}
                >
                  Get a Quote
                </Link>
              </div>
              <p className="mt-5 text-base text-primary-foreground/90">
                Or call{" "}
                <a
                  href={PHONE_HREF}
                  className="font-bold text-primary-foreground underline underline-offset-4"
                >
                  {PHONE_DISPLAY}
                </a>
              </p>
              <p className="mt-2 text-sm font-semibold text-primary-foreground/80">
                Free estimates · Replies within one business day
              </p>
            </div>
          </div>
        </section>

        <section className="bg-background py-16 sm:py-20">
          <div className="reveal mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
              How it works
            </h2>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <step.icon aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      <span className="mr-2 text-primary">0{index + 1}</span>
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="scroll-mt-20 bg-secondary py-16 sm:py-20">
          <div className="reveal mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
              Services
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {services.map((service) => (
                <article
                  key={service.title}
                  className="service-card rounded-lg border border-border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <service.icon aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-heading text-xl font-bold text-card-foreground">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {service.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 bg-background py-16 sm:py-20">
          <div className="reveal mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
              FAQ
            </h2>
            {/* Native <details>: every answer stays in the page HTML (readable by Google and AI
                tools even when collapsed), several can be open at once, and it works without JS. */}
            <div className="mt-8 border-t border-border">
              {faqs.map((faq) => (
                <details key={faq.q} className="group border-b border-border">
                  {/* preventDefault on mousedown stops a mouse click from focusing the question
                      (so no outline appears); the click still opens it, and keyboard users still
                      get the focus outline. */}
                  <summary
                    onMouseDown={(event) => event.preventDefault()}
                    className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-bold text-foreground [&::-webkit-details-marker]:hidden"
                  >
                    {faq.q}
                    <ChevronDown
                      aria-hidden="true"
                      className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  <p className="pb-5 text-base leading-relaxed text-muted-foreground">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

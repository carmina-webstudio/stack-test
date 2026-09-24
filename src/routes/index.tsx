import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

const services = [
  { title: "Lawn Care", text: "Regular mowing, edging and seasonal lawn treatments." },
  { title: "Garden Design", text: "Planting plans and new garden beds that fit your yard." },
  { title: "Yard Cleanup", text: "Leaf removal, pruning and debris hauling." },
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

      <main className="mx-auto max-w-3xl px-4">
        <section className="py-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Landscaping in Bothell, WA
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Lawn care, garden design and yard cleanup for homes in Bothell and nearby cities.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="tel:+14255550100"
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Call Now
            </a>
            <Link
              to="/quote"
              className="inline-flex items-center justify-center rounded-md border-2 border-primary px-5 py-3 text-base font-semibold text-primary hover:bg-accent"
            >
              Get a Quote
            </Link>
          </div>
        </section>

        <section className="py-6">
          <h2 className="text-2xl font-bold text-foreground">Services</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-lg font-semibold text-card-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <h2 className="text-2xl font-bold text-foreground">FAQ</h2>
          <dl className="mt-4 space-y-5">
            {faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-foreground">{f.q}</dt>
                <dd className="mt-1 text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

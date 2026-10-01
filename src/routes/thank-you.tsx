import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ClipboardCheck, Mail, Phone } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { buttonVariants } from "@/components/ui/button";
import { business } from "@/lib/business";
import { parseQuoteSummary, readQuoteSummaryRaw } from "@/lib/quote-request";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/thank-you")({
  head: () =>
    pageHead({
      title: "Thanks, we got your request",
      description: `We'll reply to your ${business.trade.toLowerCase()} quote request within one business day.`,
    }),
  component: ThankYouPage,
});

const STEPS = [
  "We will review your request",
  "We will call or email you within one business day",
  "Free estimate, no obligation",
];

/** "test" → "Test": the name as typed, with a capital first letter. */
function capitalize(name: string) {
  return name.charAt(0).toLocaleUpperCase() + name.slice(1);
}

// sessionStorage doesn't change while this page is open, so there's nothing to subscribe to.
const subscribe = () => () => {};

function ThankYouPage() {
  // The pre-rendered HTML (and no-JS visitors) get the generic version; in the browser the
  // details saved by the quote form fill in, without a hydration mismatch.
  const raw = useSyncExternalStore(subscribe, readQuoteSummaryRaw, () => null);
  const summary = useMemo(() => parseQuoteSummary(raw), [raw]);

  // Flex column: on short pages the main area grows, so the footer sits at the bottom of the
  // screen instead of leaving an empty band below it.
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 bg-secondary pb-12 sm:pb-16">
        {/* Top band: same green gradient and pattern as the home page hero. */}
        <section className="hero-pattern relative overflow-hidden bg-hero px-4 pb-20 pt-10 text-center text-primary-foreground sm:px-6 sm:pb-20 sm:pt-12">
          <div className="relative mx-auto max-w-2xl">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg motion-safe:animate-check-pop sm:size-[4.5rem]">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-9 sm:size-10"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" className="motion-safe:animate-check-draw" />
              </svg>
            </div>
            <h1 className="mt-6 text-balance font-heading text-3xl font-extrabold sm:mt-5 sm:text-4xl">
              {summary
                ? `Thanks, ${capitalize(summary.firstName)}, we got your request`
                : "Thanks, we got your request"}
            </h1>
          </div>
        </section>

        <div className="relative mx-auto -mt-12 max-w-2xl px-4 sm:px-6">
          <div className="rounded-lg border border-border bg-card p-5 shadow-lg sm:p-8">
            {summary && (
              <div className="mb-7 space-y-3 rounded-md bg-secondary p-4 sm:p-5">
                <p className="flex items-start gap-3 font-heading text-lg font-bold text-foreground">
                  <ClipboardCheck
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-primary"
                  />
                  <span>
                    {summary.service} in {summary.city}
                  </span>
                </p>
                <p className="flex items-start gap-3 text-base text-muted-foreground">
                  <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="min-w-0 break-words">
                    We'll reply to{" "}
                    <span className="font-semibold text-foreground">{summary.email}</span>
                  </span>
                </p>
              </div>
            )}

            <h2 className="font-heading text-xl font-bold text-foreground">What happens next</h2>
            <ol className="mt-5 space-y-4">
              {STEPS.map((step, index) => (
                <li key={step} className="flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-base font-bold text-primary-foreground"
                  >
                    {index + 1}
                  </span>
                  <span className="text-base font-medium text-foreground">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-8 border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">Need us sooner?</p>
              <a
                href={business.phone.href}
                className={buttonVariants({
                  variant: "accent",
                  size: "lg",
                  className:
                    "mt-2 h-14 w-full text-lg font-bold sm:h-12 sm:w-auto sm:px-8 sm:text-base [&_svg]:size-5",
                })}
              >
                <Phone aria-hidden="true" />
                Call {business.phone.display}
              </a>
              <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:gap-6">
                <Link
                  to="/"
                  className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Back to home
                </Link>
                <a
                  href="/#services"
                  className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
                >
                  See our services
                  <ArrowRight aria-hidden="true" className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

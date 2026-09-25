import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Clock3, PhoneCall } from "lucide-react";
import { PHONE_DISPLAY, PHONE_HREF, SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Get a Free Quote | Test Landscaping Co" },
      {
        name: "description",
        content: "Request a free landscaping quote in Bothell, WA.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Get a Free Quote | Test Landscaping Co" },
      {
        property: "og:description",
        content: "Request a free landscaping quote in Bothell, WA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuotePage,
});

// One style for every field (text boxes, dropdown, message box) so edges and heights line up.
const fieldClass =
  "mt-1.5 block h-12 w-full rounded-md border border-input bg-background px-3 text-base font-normal text-foreground shadow-sm focus-visible:border-primary";
const labelClass = "block text-sm font-semibold text-foreground";

function QuotePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="bg-secondary py-10 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-extrabold text-foreground sm:text-5xl">
            Get a Free Quote
          </h1>

          {/* Phones and tablets: one short line, so the form starts on the first screen. */}
          <p className="mt-3 text-base text-muted-foreground lg:hidden">
            Prefer to talk?{" "}
            <a href={PHONE_HREF} className="font-bold text-primary underline underline-offset-4">
              Call {PHONE_DISPLAY}
            </a>
            . We reply within one business day.
          </p>

          <div className="mt-6 grid items-start gap-6 lg:mt-8 lg:grid-cols-[1.5fr_0.75fr]">
            <form
              name="quote"
              method="POST"
              action="/thank-you"
              data-netlify="true"
              netlify-honeypot="bot-field"
              className="rounded-lg border border-border bg-card p-5 shadow-lg sm:p-8"
            >
              <input type="hidden" name="form-name" value="quote" />
              <p className="hidden">
                <label>
                  Don't fill this out: <input name="bot-field" tabIndex={-1} autoComplete="off" />
                </label>
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>
                  Name
                  <input
                    type="text"
                    name="name"
                    required
                    autoComplete="name"
                    className={fieldClass}
                  />
                </label>

                <label className={labelClass}>
                  Phone
                  <input
                    type="tel"
                    name="phone"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    className={fieldClass}
                  />
                </label>

                <label className={labelClass}>
                  Email
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    className={fieldClass}
                  />
                </label>

                <label className={labelClass}>
                  City
                  <input
                    type="text"
                    name="city"
                    autoComplete="address-level2"
                    className={fieldClass}
                  />
                </label>

                <label className={`${labelClass} sm:col-span-2`}>
                  Service
                  <span className="relative block">
                    {/* Starts on a placeholder so nobody sends "Lawn Care" by accident. */}
                    <select
                      name="service"
                      required
                      defaultValue=""
                      className={`${fieldClass} appearance-none pr-10 invalid:text-muted-foreground`}
                    >
                      <option value="" disabled>
                        Select a service
                      </option>
                      <option value="Lawn Care">Lawn Care</option>
                      <option value="Garden Design">Garden Design</option>
                      <option value="Yard Cleanup">Yard Cleanup</option>
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 mt-0.5 size-5 -translate-y-1/2 text-muted-foreground"
                    />
                  </span>
                </label>

                <label className={`${labelClass} sm:col-span-2`}>
                  Message
                  <textarea
                    name="message"
                    rows={4}
                    className={`${fieldClass} h-auto min-h-28 py-3`}
                  />
                </label>
              </div>

              <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto">
                Send Request
              </Button>
            </form>

            {/* Desktop only: the call option sits beside the form. */}
            <aside className="hidden rounded-lg bg-primary p-6 text-primary-foreground shadow-lg lg:sticky lg:top-24 lg:block">
              <div className="flex size-12 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <PhoneCall aria-hidden="true" />
              </div>
              <p className="mt-5 font-heading text-xl font-bold">Prefer to talk?</p>
              <a
                href={PHONE_HREF}
                className="mt-2 block text-lg font-bold underline underline-offset-4"
              >
                Call {PHONE_DISPLAY}
              </a>
              <p className="mt-5 flex items-center gap-2 text-sm text-primary-foreground/80">
                <Clock3 className="size-4" aria-hidden="true" /> We reply within one business day.
              </p>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Clock3, PhoneCall } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
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

const fieldClass =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground";

function QuotePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="bg-secondary py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-extrabold text-foreground sm:text-5xl">Get a Free Quote</h1>
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[0.75fr_1.5fr]">
            <aside className="order-first rounded-lg bg-primary p-6 text-primary-foreground shadow-lg lg:sticky lg:top-24">
              <div className="flex size-12 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <PhoneCall aria-hidden="true" />
              </div>
              <p className="mt-5 font-heading text-xl font-bold">Prefer to talk?</p>
              <a href="tel:+14255550100" className="mt-2 block text-lg font-bold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground">
                Call (425) 555-0100
              </a>
              <p className="mt-5 flex items-center gap-2 text-sm text-primary-foreground/80">
                <Clock3 className="size-4" aria-hidden="true" /> We reply within one business day.
              </p>
            </aside>

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
              Don't fill this out: <input name="bot-field" />
            </label>
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-foreground">
            Name
            <input type="text" name="name" required className={fieldClass} />
          </label>

          <label className="block text-sm font-semibold text-foreground">
            Phone
            <input type="tel" name="phone" required className={fieldClass} />
          </label>

          <label className="block text-sm font-semibold text-foreground">
            Email
            <input type="email" name="email" required className={fieldClass} />
          </label>

          <label className="block text-sm font-semibold text-foreground">
            Service
            <select name="service" className={fieldClass} defaultValue="Lawn Care">
              <option value="Lawn Care">Lawn Care</option>
              <option value="Garden Design">Garden Design</option>
              <option value="Yard Cleanup">Yard Cleanup</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-foreground">
            City
            <input type="text" name="city" className={fieldClass} />
          </label>
          </div>

          <label className="mt-5 block text-sm font-semibold text-foreground">
            Message
            <textarea name="message" rows={4} className={fieldClass} />
          </label>

          <Button type="submit" size="lg" className="mt-6 w-full text-base sm:w-auto">
            Send Request
          </Button>
        </form>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

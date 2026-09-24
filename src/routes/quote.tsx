import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

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

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Get a Free Quote</h1>

        <form
          name="quote"
          method="POST"
          action="/thank-you"
          data-netlify="true"
          netlify-honeypot="bot-field"
          className="mt-6 space-y-4"
        >
          <input type="hidden" name="form-name" value="quote" />
          <p className="hidden">
            <label>
              Don't fill this out: <input name="bot-field" />
            </label>
          </p>

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

          <label className="block text-sm font-semibold text-foreground">
            Message
            <textarea name="message" rows={4} className={fieldClass} />
          </label>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto"
          >
            Send Request
          </button>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "Thanks, we got your request | Test Landscaping Co" },
      {
        name: "description",
        content: "We'll reply to your landscaping quote request within one business day.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Thanks, we got your request | Test Landscaping Co" },
      {
        property: "og:description",
        content: "We'll reply to your landscaping quote request within one business day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Thanks, we got your request
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          We'll reply within one business day. Need us sooner? Call{" "}
          <a href="tel:+14255550100" className="font-semibold text-primary underline">
            (425) 555-0100
          </a>
          .
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}

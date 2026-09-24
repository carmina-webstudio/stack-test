import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

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

      <main className="flex min-h-[60vh] items-center bg-secondary px-4 py-16 sm:px-6">
        <div className="mx-auto w-full max-w-2xl rounded-lg border border-border bg-card p-6 text-center shadow-lg sm:p-10">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Check aria-hidden="true" />
          </div>
          <h1 className="mt-6 font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
            Thanks, we got your request
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            We'll reply within one business day. Need us sooner? Call{" "}
            <a href="tel:+14255550100" className="font-semibold text-primary underline underline-offset-4">
              (425) 555-0100
            </a>
            .
          </p>
          <Button asChild variant="outline" size="lg" className="mt-7">
            <Link to="/"><ArrowLeft aria-hidden="true" />Back to home</Link>
          </Button>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

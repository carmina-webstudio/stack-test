import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="text-base font-bold tracking-tight text-foreground sm:text-lg">
          Test Landscaping Co
        </Link>
        <a
          href="tel:+14255550100"
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Call Now
        </a>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary">
      <div className="mx-auto max-w-3xl space-y-1 px-4 py-8 text-sm text-secondary-foreground">
        <p>
          <a href="tel:+14255550100" className="font-semibold underline">
            (425) 555-0100
          </a>
        </p>
        <p>Serving Bothell, WA and nearby cities</p>
        <p>© Test Landscaping Co</p>
      </div>
    </footer>
  );
}

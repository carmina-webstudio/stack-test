import { Link } from "@tanstack/react-router";
import { Menu, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "FAQ", href: "/#faq" },
  { label: "Get a Quote", href: "/quote" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="mr-auto max-w-48 font-heading text-base font-extrabold leading-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-none sm:text-lg"
        >
          Test Landscaping Co
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {navigation.map((item) =>
            item.href === "/" || item.href === "/quote" ? (
              <Link
                key={item.label}
                to={item.href}
                className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </a>
            ),
          )}
        </nav>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Menu aria-hidden="true" />
        </Button>

        <Button asChild size="lg" className="shrink-0 px-3 sm:px-5">
          <a href="tel:+14255550100">
            <Phone aria-hidden="true" />
            <span>Call Now</span>
          </a>
        </Button>
      </div>

      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        className={`grid border-t border-border bg-background transition-[grid-template-rows] duration-300 md:hidden ${menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {navigation.map((item) =>
              item.href === "/" || item.href === "/quote" ? (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-border py-3 text-sm font-semibold text-foreground last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-border py-3 text-sm font-semibold text-foreground last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </a>
              ),
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div className="space-y-2 text-sm">
          <p className="font-heading text-lg font-extrabold">Test Landscaping Co</p>
          <p>
            <a
              href="tel:+14255550100"
              className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
            >
            (425) 555-0100
          </a>
          </p>
          <p>Serving Bothell, WA and nearby cities</p>
          <p>© Test Landscaping Co</p>
        </div>
        <nav className="flex flex-wrap content-start gap-x-6 gap-y-3 text-sm font-semibold" aria-label="Footer navigation">
          {navigation.map((item) =>
            item.href === "/" || item.href === "/quote" ? (
              <Link key={item.label} to={item.href} className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground">
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground">
                {item.label}
              </a>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}

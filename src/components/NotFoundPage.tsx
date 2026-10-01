import { Link } from "@tanstack/react-router";
import { PhoneCall } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { buttonVariants } from "@/components/ui/button";
import { business } from "@/lib/business";

/** Shown for any address that doesn't exist (old links, typos). Keeps the visitor on the site. */
export function NotFoundPage() {
  // Flex column: the main area grows, so the footer sits at the bottom of tall screens.
  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <SiteHeader />
      <main className="flex min-h-[60vh] flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <p className="font-heading text-7xl font-extrabold text-primary sm:text-6xl">404</p>
          <h1 className="mt-4 font-heading text-3xl font-extrabold text-foreground sm:text-2xl">
            Page not found
          </h1>
          <p className="mt-3 text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" className={buttonVariants({ size: "lg" })}>
              Go home
            </Link>
            <a
              href={business.phone.href}
              className={buttonVariants({ variant: "accent", size: "lg" })}
            >
              <PhoneCall aria-hidden="true" />
              Call {business.phone.display}
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

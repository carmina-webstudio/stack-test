import { Link } from "@tanstack/react-router";
import { PhoneCall } from "lucide-react";
import { PHONE_DISPLAY, PHONE_HREF, SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { buttonVariants } from "@/components/ui/button";

/** Shown for any address that doesn't exist (old links, typos). Keeps the visitor on the site. */
export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-secondary">
      <SiteHeader />
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <p className="font-heading text-7xl font-extrabold text-primary">404</p>
          <h1 className="mt-4 font-heading text-3xl font-extrabold text-foreground">
            Page not found
          </h1>
          <p className="mt-3 text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" className={buttonVariants({ size: "lg" })}>
              Go home
            </Link>
            <a href={PHONE_HREF} className={buttonVariants({ variant: "accent", size: "lg" })}>
              <PhoneCall aria-hidden="true" />
              Call {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

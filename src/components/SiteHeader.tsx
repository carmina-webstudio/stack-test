import { Link } from "@tanstack/react-router";
import { FileText, Menu, Phone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { business } from "@/lib/business";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "FAQ", href: "/#faq" },
  { label: "Get a Quote", href: "/quote" },
];

function NavItem({
  item,
  className,
  onClick,
}: {
  item: (typeof navigation)[number];
  className: string;
  onClick?: () => void;
}) {
  // Page links go through the router; section links (/#faq) are plain anchors so the
  // browser scrolls to the section.
  if (item.href === "/" || item.href === "/quote") {
    return (
      <Link to={item.href} className={className} onClick={onClick}>
        {item.label}
      </Link>
    );
  }
  return (
    <a href={item.href} className={className} onClick={onClick}>
      {item.label}
    </a>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const close = () => setMenuOpen(false);

  // While the menu is open: Escape closes it (focus goes back to the menu button) and the page
  // behind it doesn't scroll.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButton.current?.focus();
    };
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      root.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-2 px-4 sm:min-h-[3.75rem] sm:px-6 lg:px-8">
        <Link
          to="/"
          className="mr-auto flex min-h-11 min-w-0 items-center font-heading text-base font-extrabold text-foreground sm:text-[1.0625rem]"
        >
          <span className="truncate whitespace-nowrap">{business.name}</span>
        </Link>

        {/* Desktop (1024px+): links in the header. Phones and tablets use the menu button. */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              className="text-[0.8125rem] font-semibold text-muted-foreground transition-colors hover:text-primary"
            />
          ))}
        </nav>

        {/* Desktop and tablet: full Call Now button with the number spelled out on wide screens. */}
        <a
          href={business.phone.href}
          className={buttonVariants({
            className: "hidden h-11 shrink-0 px-4 text-[0.8125rem] md:inline-flex",
          })}
        >
          <Phone aria-hidden="true" />
          <span>
            Call Now<span className="hidden lg:inline"> · {business.phone.display}</span>
          </span>
        </a>

        {/* Phones: compact call icon + menu button at the far right. The big Call Now lives in
            the sticky bottom bar, where a thumb can reach it. */}
        <a
          href={business.phone.href}
          aria-label={`Call ${business.phone.display}`}
          className={buttonVariants({
            size: "icon",
            className: "size-11 md:hidden [&_svg]:size-5",
          })}
        >
          <Phone aria-hidden="true" />
        </a>
        {/* Same size, shape and icon size as the call button, in a quieter green outline style.
            No amber hover: phones keep the hover colour after a tap. */}
        <Button
          ref={menuButton}
          type="button"
          variant="outline"
          size="icon"
          className="size-11 border-primary/30 text-primary shadow-none hover:bg-primary/10 hover:text-primary lg:hidden [&_svg]:size-5"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
      </div>

      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        // inert while closed: the hidden links can't be reached with Tab or a screen reader.
        inert={!menuOpen}
        className={`grid border-t border-border bg-background transition-[grid-template-rows,visibility] duration-300 lg:hidden ${menuOpen ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr] border-t-0"}`}
      >
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {navigation
              .filter((item) => item.href !== "/quote")
              .map((item) => (
                <NavItem
                  key={item.label}
                  item={item}
                  onClick={close}
                  className="flex min-h-12 items-center border-b border-border text-base font-semibold text-foreground"
                />
              ))}
            <Link
              to="/quote"
              onClick={close}
              className={buttonVariants({
                variant: "accent",
                size: "lg",
                className: "my-3 w-full",
              })}
            >
              <FileText aria-hidden="true" />
              Get a Free Quote
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

/** Phones only: always-visible bar at the bottom of the screen with the two main actions. */
export function MobileActionBar() {
  return (
    <div
      role="region"
      aria-label="Call or get a quote"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-2 gap-3">
        <a
          href={business.phone.href}
          className={buttonVariants({ variant: "accent", size: "lg", className: "w-full px-3" })}
        >
          <Phone aria-hidden="true" />
          Call Now
        </a>
        <Link to="/quote" className={buttonVariants({ size: "lg", className: "w-full px-3" })}>
          <FileText aria-hidden="true" />
          Get a Quote
        </Link>
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <>
      {/* Extra bottom padding on phones so the fixed action bar never covers the footer. */}
      <footer className="border-t border-border bg-primary pb-24 text-primary-foreground md:pb-0">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
          <div className="space-y-2 text-sm">
            <p className="font-heading text-lg font-extrabold">{business.name}</p>
            <p>
              <a
                href={business.phone.href}
                className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
              >
                {business.phone.display}
              </a>
            </p>
            <p>Serving {business.areaServed.summary}</p>
            <p>
              © {new Date().getFullYear()} {business.name}
            </p>
          </div>
          <nav
            className="flex flex-wrap content-start gap-x-6 gap-y-1 text-sm font-semibold"
            aria-label="Footer navigation"
          >
            {navigation.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                className="inline-flex min-h-11 min-w-11 items-center justify-center underline-offset-4 hover:underline"
              />
            ))}
          </nav>
        </div>
      </footer>
      <MobileActionBar />
    </>
  );
}

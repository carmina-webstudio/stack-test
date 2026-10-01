import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/NotFoundPage";
import { pageHead } from "@/lib/seo";

// Pre-built as a static page so Netlify can serve it for unknown addresses (see netlify.toml).
// No canonical or Open Graph tags: it's served at whatever address was mistyped.
export const Route = createFileRoute("/404")({
  head: () =>
    pageHead({
      title: "Page not found",
      description:
        "This page doesn't exist or has been moved. Go to the home page or give us a call.",
    }),
  component: NotFoundPage,
});

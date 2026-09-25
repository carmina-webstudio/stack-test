import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/NotFoundPage";

// Pre-built as a static page so Netlify can serve it for unknown addresses (see netlify.toml).
export const Route = createFileRoute("/404")({
  head: () => ({
    meta: [
      { title: "Page not found | Test Landscaping Co" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NotFoundPage,
});

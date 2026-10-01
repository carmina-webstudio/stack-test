import { createFileRoute } from "@tanstack/react-router";
import { absoluteUrl, PUBLIC_PAGES } from "@/lib/business";

// Pre-rendered to .output/public/sitemap.xml at build time (listed in vite.config.ts).
// Public pages only: no /thank-you, no /404.
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const urls = PUBLIC_PAGES.map(
          (path) => `  <url>\n    <loc>${absoluteUrl(path)}</loc>\n  </url>`,
        );
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
      },
    },
  },
});

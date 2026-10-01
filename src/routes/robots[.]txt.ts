import { createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/business";

// Pre-rendered to .output/public/robots.txt at build time (listed in vite.config.ts).
// Every crawler is allowed, AI search crawlers by name too. Spec sites stay private through
// Netlify's password protection plus the noindex tag on every page, never through this file.
const ALLOWED_BOTS = [
  "Googlebot",
  "Bingbot",
  "Twitterbot",
  "facebookexternalhit",
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const groups = [...ALLOWED_BOTS, "*"].map((bot) => `User-agent: ${bot}\nAllow: /\n`);
        const text = `${groups.join("\n")}\nSitemap: ${absoluteUrl("/sitemap.xml")}\n`;
        return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      },
    },
  },
});

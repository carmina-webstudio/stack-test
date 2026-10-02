// Static site check: `npm run check` (after `npm run build`). No browser, runs in seconds.
// Reads the expected values from src/lib/business.ts and tests/site.config.ts, then checks the
// source and the pre-rendered pages in .output/public. Each check names the lesson (PR) it covers.
//
// Runs with Node's type stripping (no build step, no packages), so it only uses node: modules.
// Prints a table (id, PASS / FAIL / WARN, file, fix hint) and the placeholders still to fill.
// Exits 1 on any FAIL, which fails the Netlify deploy and the GitHub Actions run.

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { absoluteUrl, business, isPlaceholder, PUBLIC_PAGES } from "../src/lib/business.ts";
import { pages, quoteForm } from "../tests/site.config.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, ".output", "public");
const live = business.siteStatus === "live";

// Lovable's default favicon, and this template's placeholder "T" favicon. Hashes are hard-coded
// (not read from git) because Netlify's shallow clone may not have the history.
const LOVABLE_FAVICON_SHA256 = "dd821076a9b03adc2173c93956226aea3d92482d7578fc4339c5d3a2e9c24586";
const PLACEHOLDER_FAVICON_SHA256 =
  "1be42ed2316a0e5cd810936ac1bca53422cf97d5c8393a6ce4e2b54c835e3d14";

const IMAGE_OR_VIDEO = /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp|tiff?|heic|mp4|mov|webm|m4v|avi)$/i;
const RASTER_OR_VIDEO = /\.(png|jpe?g|gif|webp|avif|ico|bmp|tiff?|heic|mp4|mov|webm|m4v|avi)$/i;
const MAX_IMAGE_BYTES = 300 * 1024;
// Never walked: dependencies, build output, git data and local test output.
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".output",
  ".nitro",
  ".tanstack",
  ".vinxi",
  "dist",
  "test-results",
  "playwright-report",
  "blob-report",
]);

// ---------------------------------------------------------------------------------------------
// Results

type Status = "PASS" | "FAIL" | "WARN";
type Problem = { message: string; fix: string; file?: string };
type Result = { id: string; status: Status; file: string; message: string; fix: string };
const results: Result[] = [];

function report(id: string, status: Status, file: string, message: string, fix = "") {
  results.push({ id, status, file, message, fix });
}

/** One check: PASS when `problems` is empty, otherwise one FAIL (or WARN) row per problem. */
function check(
  id: string,
  file: string,
  passMessage: string,
  problems: Problem[],
  status: Exclude<Status, "PASS"> = "FAIL",
) {
  if (problems.length === 0) report(id, "PASS", file, passMessage);
  for (const p of problems) report(id, status, p.file ?? file, p.message, p.fix);
}

// ---------------------------------------------------------------------------------------------
// Files and HTML helpers (regex based: the pages are our own pre-rendered output)

const read = (path: string) => readFileSync(path, "utf8");
const rel = (path: string) => relative(ROOT, path).split(sep).join("/");

function walk(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name), files);
    } else files.push(join(dir, entry.name));
  }
  return files;
}

function decode(text: string) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** Visible-ish text: tags, scripts, styles and React's <!-- --> markers removed. */
function textOf(html: string) {
  return decode(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

type Tag = { name: string; attrs: Record<string, string>; raw: string };

/** Every opening tag with the given name(s), with its attributes. */
function tags(html: string, names: string): Tag[] {
  const re = new RegExp(`<(${names})\\b((?:[^>"']|"[^"]*"|'[^']*')*)>`, "gi");
  const found: Tag[] = [];
  for (const match of html.matchAll(re)) {
    const attrs: Record<string, string> = {};
    for (const a of (match[2] ?? "").matchAll(
      /([^\s=/]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]+))?/g,
    )) {
      const value = a[3] ?? a[4] ?? a[2] ?? "";
      attrs[(a[1] ?? "").toLowerCase()] = decode(value);
    }
    found.push({ name: (match[1] ?? "").toLowerCase(), attrs, raw: match[0] });
  }
  return found;
}

function meta(html: string, key: string) {
  const tag = tags(html, "meta").find(
    (t) => t.attrs["name"] === key || t.attrs["property"] === key,
  );
  return tag ? (tag.attrs["content"] ?? "") : undefined;
}

function elements(html: string, name: string) {
  const re = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, "gi");
  return [...html.matchAll(re)].map((m) => ({ outer: m[0], inner: m[1] ?? "" }));
}

/** Pre-rendered file for a page path: "/" → index.html, "/quote" → quote/index.html. */
function builtFile(path: string) {
  return path === "/" ? join(OUT, "index.html") : join(OUT, path.slice(1), "index.html");
}

const sha256 = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

/** Every string inside a value, with its path, e.g. ["address.postalCode", "..."]. */
function strings(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
  }
  return [];
}

// ---------------------------------------------------------------------------------------------
// Inputs

const built = existsSync(OUT);
const htmlPages = pages.map((p) => ({
  ...p,
  file: builtFile(p.path),
  isPublic: (PUBLIC_PAGES as readonly string[]).includes(p.path),
}));
const html = new Map<string, string>();
for (const page of htmlPages) if (existsSync(page.file)) html.set(page.path, read(page.file));

if (!built) {
  report(
    "BUILD",
    "FAIL",
    ".output/public",
    "No build output found",
    "Run `npm run build` first, then `npm run check`.",
  );
}

// ---------------------------------------------------------------------------------------------
// L1 netlify.toml [PR #4]

{
  const file = "netlify.toml";
  const toml = existsSync(join(ROOT, file)) ? read(join(ROOT, file)) : "";
  const problems: Problem[] = [];
  if (!/^\s*publish\s*=\s*"\.output\/public"/m.test(toml)) {
    problems.push({
      message: 'publish is not ".output/public"',
      fix: 'Set publish = ".output/public" under [build].',
    });
  }
  if (!/^\s*NITRO_PRESET\s*=\s*"cloudflare-module"/m.test(toml)) {
    problems.push({
      message: 'NITRO_PRESET = "cloudflare-module" is missing',
      fix: 'Add NITRO_PRESET = "cloudflare-module" under [build.environment]; without it the Netlify build fails.',
    });
  }
  check("L1", file, "publish dir and NITRO_PRESET set", problems);
}

// ---------------------------------------------------------------------------------------------
// L2 every route is pre-rendered, with an h1 and body text

{
  const routesDir = join(ROOT, "src", "routes");
  const viteConfig = read(join(ROOT, "vite.config.ts"));
  const listed = new Set([...viteConfig.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]));
  const problems: Problem[] = [];
  const routePaths: string[] = [];

  for (const file of walk(routesDir)) {
    const name = rel(file).replace(/^src\/routes\//, "");
    if (!/\.(tsx?|jsx?)$/.test(name) || /(^|\/)__root\./.test(name)) continue;
    let path = "/" + name.replace(/\.(tsx?|jsx?)$/, "").replace(/\[\.\]/g, ".");
    path = path.replace(/\/index$/, "") || "/";
    if (/[$_]/.test(path.split("/").pop() ?? "")) {
      problems.push({
        message: `Dynamic or layout route ${rel(file)} isn't checked`,
        fix: "List each real URL of this route in tanstackStart.pages and tests/site.config.ts.",
        file: rel(file),
      });
      continue;
    }
    routePaths.push(path);
    if (!listed.has(path)) {
      problems.push({
        message: `${path} is not in tanstackStart.pages, so it isn't pre-rendered`,
        fix: `Add { path: "${path}" } to tanstackStart.pages in vite.config.ts.`,
        file: "vite.config.ts",
      });
    }
    const isHtml = !/\.[a-z]+$/i.test(path);
    if (built && !isHtml && !existsSync(join(OUT, path.slice(1)))) {
      problems.push({
        message: `${path} was not generated`,
        fix: "Check the route builds without errors, then rebuild.",
        file: rel(file),
      });
    }
    if (!isHtml) continue;
    if (!pages.some((p) => p.path === path)) {
      problems.push({
        message: `${path} is not in tests/site.config.ts, so the browser tests skip it`,
        fix: `Add { path: "${path}", ... } to pages in tests/site.config.ts.`,
        file: "tests/site.config.ts",
      });
    }
    if (!built) continue;
    const page = builtFile(path);
    if (!existsSync(page)) {
      problems.push({
        message: `${path} has no pre-rendered ${rel(page)}`,
        fix: "Add the page to tanstackStart.pages and rebuild.",
        file: rel(file),
      });
      continue;
    }
    const content = read(page);
    const h1 = elements(content, "h1")[0];
    if (!h1 || !textOf(h1.inner)) {
      problems.push({
        message: `${path} has no h1 text in the pre-rendered HTML`,
        fix: "Give the page an h1 rendered on the server (not only after JavaScript runs).",
        file: rel(file),
      });
    }
    const main = elements(content, "main")[0];
    if (textOf(main?.inner ?? "").length < 40) {
      problems.push({
        message: `${path} has (almost) no body text in the pre-rendered HTML`,
        fix: "Put the page content inside <main>, rendered on the server.",
        file: rel(file),
      });
    }
  }
  for (const page of pages) {
    if (!routePaths.includes(page.path)) {
      problems.push({
        message: `${page.path} is in tests/site.config.ts but has no route`,
        fix: "Add the route file in src/routes, or remove the page from tests/site.config.ts.",
        file: "tests/site.config.ts",
      });
    }
  }
  check("L2", "src/routes", `${routePaths.length} routes listed and pre-rendered`, problems);
}

// ---------------------------------------------------------------------------------------------
// L3 head tags on every page [Lovable SEO review 2026-10-01: 404 had no description,
// no page had og:image or og:url]

if (built) {
  const problems: Problem[] = [];
  const warnings: Problem[] = [];
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  for (const page of htmlPages) {
    const content = html.get(page.path);
    if (!content) continue;
    const file = rel(page.file);
    const fail = (message: string, fix: string) => problems.push({ message, fix, file });

    const h1s = elements(content, "h1").length;
    if (h1s !== 1) fail(`${page.path} has ${h1s} h1 headings`, "Use exactly one h1 per page.");
    const title = textOf(elements(content, "title")[0]?.inner ?? "");
    if (!title) fail(`${page.path} has no <title>`, "Use pageHead({ title, ... }) in the route.");
    else if (titles.has(title)) {
      fail(
        `${page.path} has the same title as ${titles.get(title)}`,
        "Give each page its own title.",
      );
    } else titles.set(title, page.path);
    const description = meta(content, "description")?.trim() ?? "";
    if (!description) {
      fail(`${page.path} has no meta description`, "Pass a description to pageHead().");
    } else if (descriptions.has(description)) {
      fail(
        `${page.path} has the same description as ${descriptions.get(description)}`,
        "Give each page its own description.",
      );
    } else descriptions.set(description, page.path);
    if (!/<html\b[^>]*\blang="[a-z]{2}/i.test(content)) {
      fail(`${page.path} has no html lang`, 'Keep <html lang="en"> in src/routes/__root.tsx.');
    }

    if (!page.isPublic) continue;
    for (const key of [
      "og:title",
      "og:description",
      "og:url",
      "og:type",
      "og:site_name",
      "twitter:card",
    ]) {
      if (!meta(content, key)?.trim()) {
        fail(`${page.path} is missing ${key}`, "Pass path to pageHead() for public pages.");
      }
    }
    const canonical = tags(content, "link").find((t) => t.attrs["rel"] === "canonical");
    const ogUrl = meta(content, "og:url");
    if (ogUrl && canonical && ogUrl !== canonical.attrs["href"]) {
      fail(
        `${page.path} og:url (${ogUrl}) differs from canonical`,
        "Both come from pageHead(path).",
      );
    }
    const image = meta(content, "og:image");
    if (!image) {
      (live ? problems : warnings).push({
        message: `${page.path} has no og:image (link previews show no picture)`,
        fix: "Add a 1200x630 image to public/ and set business.shareImage.",
        file,
      });
    } else if (!image.startsWith(`${business.siteUrl}/`)) {
      fail(
        `${page.path} og:image is not an absolute URL on this site: ${image}`,
        "Use absoluteUrl().",
      );
    } else if (!existsSync(join(OUT, image.slice(business.siteUrl.length + 1)))) {
      fail(
        `${page.path} og:image ${image} doesn't exist in the build`,
        "Put the image in public/.",
      );
    }
  }
  check("L3", "src/lib/seo.ts", "title, description, lang, Open Graph on every page", problems);
  for (const w of warnings) report("L3", "WARN", w.file ?? "", w.message, w.fix);
}

// ---------------------------------------------------------------------------------------------
// L4 robots meta matches siteStatus

if (built) {
  const problems: Problem[] = [];
  for (const page of htmlPages) {
    const content = html.get(page.path);
    if (!content) continue;
    const robots = meta(content, "robots") ?? "";
    const noindex = /noindex/i.test(robots);
    const shouldIndex = live && page.isPublic;
    if (shouldIndex && noindex) {
      problems.push({
        message: `${page.path} is noindex on a live site`,
        fix: "Public pages are indexable once siteStatus is live; check pageHead().",
        file: rel(page.file),
      });
    }
    if (!shouldIndex && !(noindex && /nofollow/i.test(robots))) {
      problems.push({
        message: `${page.path} robots is "${robots || "missing"}", expected "noindex, nofollow"`,
        fix: live
          ? "/thank-you and /404 stay noindex on a live site."
          : 'While siteStatus is "spec", every page must be noindex, nofollow.',
        file: rel(page.file),
      });
    }
  }
  check(
    "L4",
    "src/lib/seo.ts",
    `robots meta matches siteStatus "${business.siteStatus}"`,
    problems,
  );
}

// ---------------------------------------------------------------------------------------------
// L5 canonical, sitemap.xml, robots.txt [spec privacy = Netlify Private + noindex, never robots.txt]

if (built) {
  const problems: Problem[] = [];
  for (const page of htmlPages.filter((p) => p.isPublic)) {
    const content = html.get(page.path) ?? "";
    const canonical = tags(content, "link").find((t) => t.attrs["rel"] === "canonical");
    const expected = absoluteUrl(page.path);
    if (canonical?.attrs["href"] !== expected) {
      problems.push({
        message: `${page.path} canonical is ${canonical?.attrs["href"] ?? "missing"}, expected ${expected}`,
        fix: "Pass path to pageHead(); siteUrl comes from business.ts.",
        file: rel(page.file),
      });
    }
  }
  for (const page of htmlPages.filter((p) => !p.isPublic)) {
    const content = html.get(page.path) ?? "";
    if (tags(content, "link").some((t) => t.attrs["rel"] === "canonical")) {
      problems.push({
        message: `${page.path} is not public but has a canonical tag`,
        fix: "Don't pass path to pageHead() for this page.",
        file: rel(page.file),
      });
    }
  }

  const sitemapFile = join(OUT, "sitemap.xml");
  const sitemap = existsSync(sitemapFile) ? read(sitemapFile) : "";
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1] ?? "").trim());
  const expectedLocs = PUBLIC_PAGES.map((p) => absoluteUrl(p));
  if (!sitemap) {
    problems.push({
      message: "sitemap.xml missing",
      fix: "Keep /sitemap.xml in tanstackStart.pages.",
      file: "src/routes/sitemap[.]xml.ts",
    });
  } else if (locs.slice().sort().join("|") !== expectedLocs.slice().sort().join("|")) {
    problems.push({
      message: `sitemap.xml lists ${locs.join(", ") || "nothing"}; expected ${expectedLocs.join(", ")}`,
      fix: "sitemap.xml must list exactly PUBLIC_PAGES from business.ts.",
      file: "src/routes/sitemap[.]xml.ts",
    });
  }

  const robotsFile = join(OUT, "robots.txt");
  const robots = existsSync(robotsFile) ? read(robotsFile) : "";
  const sitemapLine = `Sitemap: ${absoluteUrl("/sitemap.xml")}`;
  if (!robots.split(/\r?\n/).some((line) => line.trim() === sitemapLine)) {
    problems.push({
      message: `robots.txt has no "${sitemapLine}" line`,
      fix: "Keep the Sitemap line in src/routes/robots[.]txt.ts.",
      file: "src/routes/robots[.]txt.ts",
    });
  }
  // Group the rules by user-agent, then look for a "Disallow: /" that blocks a crawler we need.
  const groups: { agents: string[]; disallow: string[] }[] = [];
  let current: { agents: string[]; disallow: string[] } | undefined;
  let lastWasAgent = false;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const [key = "", ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (/^user-agent$/i.test(key.trim())) {
      if (!current || !lastWasAgent) groups.push((current = { agents: [], disallow: [] }));
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (key.trim()) {
      if (/^disallow$/i.test(key.trim()) && current) current.disallow.push(value);
      lastWasAgent = false;
    }
  }
  const mustAllow = [
    "*",
    "Googlebot",
    "Bingbot",
    "GPTBot",
    "OAI-SearchBot",
    "ClaudeBot",
    "PerplexityBot",
    "Google-Extended",
  ];
  for (const bot of mustAllow) {
    const own = groups.filter((g) => g.agents.includes(bot.toLowerCase()));
    const applies = own.length ? own : groups.filter((g) => g.agents.includes("*"));
    if (applies.some((g) => g.disallow.some((d) => d === "/" || d === "/*"))) {
      problems.push({
        message: `robots.txt blocks ${bot}`,
        fix: "Never block crawlers in robots.txt; spec sites stay private with Netlify Private + noindex.",
        file: "src/routes/robots[.]txt.ts",
      });
    }
  }
  check(
    "L5",
    "sitemap.xml / robots.txt",
    "canonical, sitemap.xml and robots.txt correct",
    problems,
  );
}

// ---------------------------------------------------------------------------------------------
// L6 homepage JSON-LD [Lovable accordion dropped the FAQ answers from the HTML]

if (built) {
  const file = "src/lib/seo.ts";
  const content = html.get("/") ?? "";
  const problems: Problem[] = [];
  const nodes: Record<string, unknown>[] = [];
  for (const script of elements(content, "script").filter((s) =>
    /application\/ld\+json/.test(s.outer),
  )) {
    try {
      const data = JSON.parse(script.inner) as Record<string, unknown>;
      const graph = (data["@graph"] as Record<string, unknown>[] | undefined) ?? [data];
      nodes.push(...graph);
      for (const [path, value] of strings(data)) {
        if (!value.trim() || isPlaceholder(value)) {
          problems.push({
            message: `JSON-LD ${path} is empty or a placeholder`,
            fix: "Leave unknown facts out of the schema (see filled() in business.ts).",
          });
        }
      }
      const empties = JSON.stringify(data).match(/:(null|\[\]|\{\})/g);
      if (empties) {
        problems.push({
          message: `JSON-LD has empty values (${empties.join(", ")})`,
          fix: "Leave empty facts out of the schema.",
        });
      }
    } catch (error) {
      problems.push({
        message: `JSON-LD doesn't parse: ${(error as Error).message}`,
        fix: "Build the schema with schemaGraph() in seo.ts.",
      });
    }
  }
  const biz = nodes.find((n) => n["@type"] === business.schemaType);
  if (!biz) {
    problems.push({
      message: `No ${business.schemaType} node in the homepage JSON-LD`,
      fix: "Include localBusinessSchema() on the home page.",
    });
  } else {
    const expect = { name: business.name, telephone: business.phone.schema, url: absoluteUrl("/") };
    for (const [key, value] of Object.entries(expect)) {
      if (biz[key] !== value) {
        problems.push({
          message: `${business.schemaType} ${key} is ${String(biz[key])}, expected ${value}`,
          fix: "The schema must read from business.ts.",
        });
      }
    }
  }

  // The visible FAQ: <details><summary>question</summary>answer</details>.
  const visible = elements(content, "details").map((d) => {
    const summary = elements(d.inner, "summary")[0];
    return {
      q: textOf(summary?.inner ?? ""),
      a: textOf(d.inner.replace(/<summary\b[\s\S]*?<\/summary>/i, "")),
    };
  });
  const faqNode = nodes.find((n) => n["@type"] === "FAQPage");
  const schemaFaq = ((faqNode?.["mainEntity"] as Record<string, unknown>[] | undefined) ?? []).map(
    (q) => ({
      q: String(q["name"] ?? ""),
      a: String((q["acceptedAnswer"] as Record<string, unknown> | undefined)?.["text"] ?? ""),
    }),
  );
  const same = (a: { q: string; a: string }[], b: { q: string; a: string }[]) =>
    JSON.stringify(a) === JSON.stringify(b);
  if (business.faqs.length > 0 && !faqNode) {
    problems.push({
      message: "No FAQPage in the homepage JSON-LD",
      fix: "Include faqSchema(business.faqs).",
    });
  }
  if (!same(visible, business.faqs)) {
    problems.push({
      message: `Visible FAQ (${visible.length} questions in the HTML) doesn't match business.faqs (${business.faqs.length}); missing or different: ${business.faqs
        .filter((f) => !visible.some((v) => v.q === f.q && v.a === f.a))
        .map((f) => `"${f.q}"`)
        .join(", ")}`,
      fix: "Render every question and answer from business.faqs in native <details>/<summary>, so answers are in the HTML.",
      file: "src/routes/index.tsx",
    });
  }
  if (faqNode && !same(schemaFaq, visible)) {
    problems.push({
      message: "FAQPage schema doesn't equal the visible FAQ",
      fix: "Build both from business.faqs.",
    });
  }
  check(
    "L6",
    file,
    `JSON-LD parses; ${business.schemaType} and FAQPage match business.ts`,
    problems,
  );
}

// ---------------------------------------------------------------------------------------------
// L7 every tel: link uses the business.ts phone

if (built) {
  const problems: Problem[] = [];
  const digits = (s: string) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  if (
    digits(business.phone.href) !== digits(business.phone.display) ||
    digits(business.phone.href) !== digits(business.phone.schema)
  ) {
    problems.push({
      message: "business.phone href, display and schema are different numbers",
      fix: "Make the three phone formats in business.ts the same number.",
      file: "src/lib/business.ts",
    });
  }
  let count = 0;
  for (const page of htmlPages) {
    for (const link of tags(html.get(page.path) ?? "", "a")) {
      const href = link.attrs["href"] ?? "";
      if (!/^tel:/i.test(href)) continue;
      count++;
      if (href !== business.phone.href) {
        problems.push({
          message: `${page.path} has tel link ${href}, expected ${business.phone.href}`,
          fix: "Use business.phone.href for every call link.",
          file: rel(page.file),
        });
      }
    }
  }
  if (count === 0)
    problems.push({
      message: "No tel: links on any page",
      fix: "Add Call Now links with business.phone.href.",
    });
  check("L7", "src/lib/business.ts", `${count} tel: links, all ${business.phone.href}`, problems);
}

// ---------------------------------------------------------------------------------------------
// L8 quote form fields equal public/__forms.html [PR #11]

if (built) {
  const problems: Problem[] = [];
  const staticPath = join(ROOT, quoteForm.staticCopy);
  const staticHtml = existsSync(staticPath) ? read(staticPath) : "";
  const formIn = (content: string) => {
    const form = elements(content, "form").find((f) =>
      new RegExp(`name="${quoteForm.name}"`).test(f.outer.slice(0, f.outer.indexOf(">"))),
    );
    if (!form) return undefined;
    return {
      open: tags(form.outer, "form")[0],
      names: tags(form.outer, "input|select|textarea")
        .map((t) => t.attrs["name"] ?? "")
        .filter(Boolean),
      options: tags(form.outer, "option")
        .map((t) => t.attrs["value"] ?? "")
        .filter(Boolean),
      formName: tags(form.outer, "input").find((t) => t.attrs["name"] === "form-name")?.attrs[
        "value"
      ],
    };
  };
  const pageForm = formIn(html.get(quoteForm.path) ?? "");
  const staticForm = formIn(staticHtml);
  const sorted = (a: string[]) => [...new Set(a)].sort().join(", ");
  const expected = [...quoteForm.hiddenFields, ...quoteForm.fields.map((f) => f.name)];
  if (!pageForm) {
    problems.push({
      message: `No form named "${quoteForm.name}" in the pre-rendered ${quoteForm.path}`,
      fix: "Render the form on the server.",
      file: "src/routes/quote.tsx",
    });
  } else if (sorted(pageForm.names) !== sorted(expected)) {
    problems.push({
      message: `Quote page fields (${sorted(pageForm.names)}) differ from tests/site.config.ts (${sorted(expected)})`,
      fix: "Update tests/site.config.ts and public/__forms.html together with the form.",
      file: "src/routes/quote.tsx",
    });
  }
  if (!staticForm) {
    problems.push({
      message: `${quoteForm.staticCopy} has no form named "${quoteForm.name}"`,
      fix: "Keep the static copy of the form for Netlify.",
      file: quoteForm.staticCopy,
    });
  } else {
    if (pageForm && sorted(pageForm.names) !== sorted(staticForm.names)) {
      problems.push({
        message: `Field names differ: page has ${sorted(pageForm.names)}; static copy has ${sorted(staticForm.names)}`,
        fix: "Keep public/__forms.html in sync with the form (same field names).",
        file: quoteForm.staticCopy,
      });
    }
    if (staticForm.open?.attrs["data-netlify"] !== "true") {
      problems.push({
        message: 'Static form copy has no data-netlify="true"',
        fix: "Netlify only collects forms it finds at deploy time.",
        file: quoteForm.staticCopy,
      });
    }
    if (staticForm.formName !== quoteForm.name || pageForm?.formName !== quoteForm.name) {
      problems.push({
        message: `Hidden form-name isn't "${quoteForm.name}" in both copies`,
        fix: 'Both forms need <input type="hidden" name="form-name" value="quote">.',
        file: quoteForm.staticCopy,
      });
    }
    const services = business.services.map((s) => s.name);
    if (sorted(staticForm.options) !== sorted(services)) {
      problems.push({
        message: `Static form services (${sorted(staticForm.options)}) differ from business.ts (${sorted(services)})`,
        fix: "Update the <option>s in public/__forms.html.",
        file: quoteForm.staticCopy,
      });
    }
  }
  for (const name of quoteForm.hiddenFields) {
    if (pageForm && !pageForm.names.includes(name)) {
      problems.push({
        message: `Quote form has no ${name} field`,
        fix: "form-name, bot-field and subject are required for Netlify.",
        file: "src/routes/quote.tsx",
      });
    }
  }
  check(
    "L8",
    quoteForm.staticCopy,
    "form fields match the static copy, data-netlify set",
    problems,
  );
}

// ---------------------------------------------------------------------------------------------
// L9 no Lovable branding, not Lovable's favicon [PR #7, #8]

{
  const problems: Problem[] = [];
  const favicon = join(ROOT, "public", "favicon.ico");
  if (!existsSync(favicon)) {
    problems.push({
      message: "public/favicon.ico is missing",
      fix: "Add the client's logo or initials as favicon.ico.",
      file: "public/favicon.ico",
    });
  } else if (sha256(favicon) === LOVABLE_FAVICON_SHA256) {
    problems.push({
      message: "favicon.ico is Lovable's default",
      fix: "Replace it with the client's logo or initials.",
      file: "public/favicon.ico",
    });
  }
  const branded = [
    ...walk(join(ROOT, "public")).filter((f) => /\.(html?|txt|xml|json|webmanifest|svg)$/i.test(f)),
    ...(built ? walk(OUT).filter((f) => /\.(html?|txt|xml|webmanifest)$/i.test(f)) : []),
  ];
  for (const file of branded) {
    const content = read(file);
    const hit = content.match(/lovable|gpt-engineer/i);
    if (hit) {
      problems.push({
        message: `"${hit[0]}" found in ${rel(file)}`,
        fix: "Remove Lovable branding (meta tags, images, badges, text).",
        file: rel(file),
      });
    }
  }
  check("L9", "public/", "no Lovable branding; favicon isn't Lovable's", problems);
}

// ---------------------------------------------------------------------------------------------
// L10 no backend or email service (no-email, no-backend rules)

{
  const problems: Problem[] = [];
  const pkg = JSON.parse(read(join(ROOT, "package.json"))) as Record<
    string,
    Record<string, string> | undefined
  >;
  const deps = Object.keys({ ...pkg["dependencies"], ...pkg["devDependencies"] });
  const banned =
    /supabase|resend|nodemailer|@sendgrid|mailgun|postmark|@lovable\.dev\/(cloud|email|webhooks|mcp)/i;
  for (const dep of deps.filter((d) => banned.test(d))) {
    problems.push({
      message: `package.json depends on ${dep}`,
      fix: "No Lovable backend features and no email service; forms use Netlify Forms.",
      file: "package.json",
    });
  }
  for (const file of walk(join(ROOT, "src")).filter((f) => /\.(tsx?|jsx?)$/.test(f))) {
    const hit = read(file).match(
      /supabase|from ["']resend["']|nodemailer|lovable\.app\/api|@lovable\.dev\/(cloud|email)/i,
    );
    if (hit)
      problems.push({
        message: `"${hit[0]}" in ${rel(file)}`,
        fix: "Remove backend/email code; use Netlify Forms.",
        file: rel(file),
      });
  }
  for (const dir of ["netlify/functions", "netlify/edge-functions", "supabase"]) {
    if (existsSync(join(ROOT, dir))) {
      problems.push({
        message: `${dir}/ exists`,
        fix: "No serverless functions or backend: remove it.",
        file: dir,
      });
    }
  }
  check("L10", "package.json", "no Supabase, Lovable Cloud, email service or functions", problems);
}

// ---------------------------------------------------------------------------------------------
// L11 no image or video files outside public/ and src/assets [PR #1: screenshots committed]

{
  const problems = walk(ROOT)
    .map(rel)
    .filter(
      (f) => IMAGE_OR_VIDEO.test(f) && !f.startsWith("public/") && !f.startsWith("src/assets/"),
    )
    .map((f) => ({
      message: `Image/video file ${f} outside public/ and src/assets`,
      fix: "Delete it before committing. Screenshots go in the PR description, never in git.",
      file: f,
    }));
  check("L11", ".", "no stray image or video files", problems);
}

// ---------------------------------------------------------------------------------------------
// L12 placeholders: spec → WARN, live → FAIL

const placeholders: { where: string; what: string }[] = [];
{
  for (const [path, value] of strings(business)) {
    if (isPlaceholder(value)) placeholders.push({ where: `business.${path}`, what: value });
  }
  const scanned = [
    ...walk(join(ROOT, "src")).filter(
      (f) => /\.(tsx?|jsx?|css|md)$/.test(f) && !f.endsWith(join("lib", "business.ts")),
    ),
    ...walk(join(ROOT, "public")).filter((f) => /\.(html?|txt|xml|json|svg)$/.test(f)),
  ];
  for (const file of scanned) {
    for (const m of read(file).matchAll(/\[PLACEHOLDER:[^\]]*\]/g))
      placeholders.push({ where: rel(file), what: m[0] });
    const old = read(file).match(/\bPLACEHOLDER\b(?!:)/);
    if (old)
      placeholders.push({
        where: rel(file),
        what: `Old-style "${old[0]}" marker: use [PLACEHOLDER: what's needed]`,
      });
  }
  check(
    "L12",
    "src/lib/business.ts",
    "no placeholders left",
    placeholders.map((p) => ({
      message: `${p.where}: ${p.what}`,
      fix: live
        ? "Fill it in with the client's real information before going live."
        : "Fill in before going live.",
      file: p.where.startsWith("business.") ? "src/lib/business.ts" : p.where,
    })),
    live ? "FAIL" : "WARN",
  );
}

// ---------------------------------------------------------------------------------------------
// L13 live only: real domain, real favicon, no test data

{
  const problems: Problem[] = [];
  if (/\.netlify\.app/i.test(business.siteUrl)) {
    problems.push({
      message: `siteUrl is ${business.siteUrl}`,
      fix: "Set siteUrl to the client's domain in business.ts.",
      file: "src/lib/business.ts",
    });
  }
  const favicon = join(ROOT, "public", "favicon.ico");
  if (existsSync(favicon) && sha256(favicon) === PLACEHOLDER_FAVICON_SHA256) {
    problems.push({
      message: 'favicon.ico is the placeholder "T"',
      fix: "Replace it with the client's logo or initials.",
      file: "public/favicon.ico",
    });
  }
  const testData = /555-01\d\d|555\D?01\d\d|@example\.com|Test Landscaping/gi;
  const sources: [string, string][] = [
    ["src/lib/business.ts", JSON.stringify(business)],
    ...(built
      ? walk(OUT)
          .filter((f) => f.endsWith(".html"))
          .map((f): [string, string] => [
            rel(f),
            textOf(read(f)) +
              " " +
              tags(read(f), "a|meta|input")
                .map((t) => t.raw)
                .join(" "),
          ])
      : []),
  ];
  const allHits = new Set<string>();
  for (const [file, content] of sources) {
    const hits = [...new Set(content.match(testData) ?? [])];
    hits.forEach((hit) => allHits.add(hit));
    if (hits.length) {
      problems.push({
        message: `Test data in ${file}: ${hits.join(", ")}`,
        fix: "Replace with the client's real details.",
        file,
      });
    }
  }
  if (live)
    check("L13", "src/lib/business.ts", "real domain, real favicon, no test data", problems);
  else if (problems.length === 0)
    report("L13", "PASS", "src/lib/business.ts", "nothing that blocks going live");
  else {
    report(
      "L13",
      "WARN",
      "src/lib/business.ts",
      `Will FAIL at go-live: ${[
        ...problems.filter((p) => !p.message.startsWith("Test data")).map((p) => p.message),
        ...(allHits.size ? [`test data (${[...allHits].join(", ")})`] : []),
      ].join("; ")}`,
      'Fix them when siteStatus becomes "live".',
    );
  }
}

// ---------------------------------------------------------------------------------------------
// L14 images: small files, no layout jump

{
  const problems: Problem[] = [];
  for (const file of [...walk(join(ROOT, "public")), ...walk(join(ROOT, "src", "assets"))].filter(
    (f) => RASTER_OR_VIDEO.test(f) || f.endsWith(".svg"),
  )) {
    const size = statSync(file).size;
    if (size > MAX_IMAGE_BYTES) {
      problems.push({
        message: `${rel(file)} is ${Math.round(size / 1024)} KB (max 300 KB)`,
        fix: "Resize and compress it (WebP/AVIF, 1600px wide at most).",
        file: rel(file),
      });
    }
  }
  for (const page of htmlPages) {
    for (const img of tags(html.get(page.path) ?? "", "img")) {
      const sized =
        (img.attrs["width"] && img.attrs["height"]) ||
        /aspect-ratio|aspect-/.test(`${img.attrs["style"] ?? ""} ${img.attrs["class"] ?? ""}`);
      if (!sized) {
        problems.push({
          message: `${page.path}: <img src="${img.attrs["src"] ?? ""}"> has no width/height or aspect ratio`,
          fix: "Set width and height (or an aspect-ratio class) so the page doesn't jump while it loads.",
          file: rel(page.file),
        });
      }
    }
  }
  check("L14", "public/", "images under 300 KB and sized", problems);
}

// ---------------------------------------------------------------------------------------------
// L15 no promises the client hasn't confirmed (content rule; "no obligation" on the thank-you
// page, PR #14)

if (built) {
  const problems: Problem[] = [];
  const CLAIMS =
    /\b(no[- ]obligation|licensed|insured|bonded|certified|accredited|guarantee[ds]?|warrant(y|ies)|\d+\+? years|years of experience|since (19|20)\d\d|family[- ]owned|award[- ]winning|top[- ]rated|best|#1|number one|\d(\.\d)?[- ]star|trusted by|satisfaction)\b|#1/gi;
  const confirmed = business.claims.join(" ").toLowerCase();
  for (const page of htmlPages) {
    const text = textOf(html.get(page.path) ?? "");
    const hits = [...new Set(text.match(CLAIMS) ?? [])].filter(
      (hit) => !confirmed.includes(hit.toLowerCase()),
    );
    for (const hit of hits) {
      const at = text.toLowerCase().indexOf(hit.toLowerCase());
      problems.push({
        message: `${page.path} promises "${hit}": "…${text.slice(Math.max(0, at - 30), at + hit.length + 30)}…"`,
        fix: "Remove it, or (only if the client confirmed it) add the wording to business.claims.",
        file: rel(page.file),
      });
    }
  }
  check("L15", "src/lib/business.ts", "no unconfirmed promises on any page", problems);
}

// ---------------------------------------------------------------------------------------------
// Output

const order = ["BUILD", ...Array.from({ length: 15 }, (_, i) => `L${i + 1}`)];
results.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
const fails = results.filter((r) => r.status === "FAIL");
const warns = results.filter((r) => r.status === "WARN");
const color = process.stdout.isTTY && !process.env["NO_COLOR"];
const paint = (status: Status) =>
  !color ? status : `\x1b[${status === "PASS" ? 32 : status === "FAIL" ? 31 : 33}m${status}\x1b[0m`;
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const fileWidth = Math.min(36, Math.max(4, ...results.map((r) => r.file.length)));

console.log(`\nSite check: ${business.name} (siteStatus "${business.siteStatus}")\n`);
console.log(`${"ID".padEnd(5)} ${"STATUS".padEnd(6)} ${"FILE".padEnd(fileWidth)} RESULT / FIX`);
console.log(`${"-".repeat(5)} ${"-".repeat(6)} ${"-".repeat(fileWidth)} ${"-".repeat(40)}`);
for (const r of results) {
  console.log(
    `${r.id.padEnd(5)} ${paint(r.status)}${" ".repeat(7 - r.status.length)}${cut(r.file, fileWidth).padEnd(fileWidth)} ${r.message}`,
  );
  if (r.fix && r.status !== "PASS") console.log(`${" ".repeat(13 + fileWidth)} → ${r.fix}`);
}

console.log(`\nPlaceholders to fill (${placeholders.length}):`);
if (placeholders.length === 0) console.log("  none");
for (const p of placeholders) console.log(`  - ${p.where}: ${p.what}`);

const passed = new Set(results.filter((r) => r.status === "PASS").map((r) => r.id)).size;
console.log(`\n${passed} checks passed, ${fails.length} FAIL, ${warns.length} WARN.`);
if (fails.length > 0) {
  console.log("Site check FAILED. Fix every FAIL above (the line under each one says how).\n");
  process.exit(1);
}
console.log("Site check passed.\n");

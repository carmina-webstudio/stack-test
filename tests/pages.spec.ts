// A. Every page: loads cleanly, no broken or empty content, nothing wider than the screen,
//    complete footer. F. Thank-you and 404 pages. H. Full-page screenshots for review.

import { expect, test } from "@playwright/test";
import { business } from "../src/lib/business.ts";
import { forbiddenText, nav, notFound, pages, thankYou } from "./site.config.ts";
import { open, scrollToBottom, watchPage } from "./helpers.ts";

const knownPaths = new Set(pages.map((p) => p.path));

for (const config of pages) {
  test.describe(`${config.name} page (${config.path})`, () => {
    test("loads with no console errors, failed requests or broken images", async ({ page }) => {
      const problems = watchPage(page);
      const response = await open(page, config.path);
      expect(response?.status(), "HTTP status").toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(config.h1);
      // Load every lazy image too.
      await scrollToBottom(page);
      const images = await page.locator("img").evaluateAll((imgs) =>
        (imgs as HTMLImageElement[]).map((img) => ({
          src: img.currentSrc || img.src,
          broken: !img.complete || img.naturalWidth === 0,
          alt: img.getAttribute("alt"),
        })),
      );
      expect(
        images.filter((i) => i.broken).map((i) => i.src),
        "broken images",
      ).toEqual([]);
      expect(
        images.filter((i) => i.alt === null).map((i) => i.src),
        "images without alt",
      ).toEqual([]);
      expect(problems, "console errors / failed requests").toEqual([]);
    });

    test("no broken, empty or placeholder content", async ({ page }) => {
      await open(page, config.path);
      const text = await page.locator("body").innerText();
      expect(
        text.match(forbiddenText)?.[0],
        "leftover text like undefined/null/NaN",
      ).toBeUndefined();

      const empty = await page
        .locator("h1, h2, h3, h4, h5, h6, a, button, li, summary, label")
        .evaluateAll((els) =>
          els
            .filter((el) => {
              const label =
                el.textContent?.trim() ||
                el.getAttribute("aria-label")?.trim() ||
                (el.getAttribute("aria-labelledby") &&
                  document
                    .getElementById(el.getAttribute("aria-labelledby")!)
                    ?.textContent?.trim()) ||
                el.querySelector("img[alt]:not([alt=''])")?.getAttribute("alt");
              return !label;
            })
            .map((el) => el.outerHTML.slice(0, 120)),
        );
      expect(empty, "empty headings, links, buttons or list items").toEqual([]);

      const hrefs = await page
        .locator("a")
        .evaluateAll((links) =>
          links.map((a) => ({ href: a.getAttribute("href"), html: a.outerHTML.slice(0, 100) })),
        );
      const bad = hrefs.filter((l) => l.href === null || l.href.trim() === "" || l.href === "#");
      expect(
        bad.map((l) => l.html),
        'links with no href or href="#"',
      ).toEqual([]);
    });

    test("every internal link goes to a real page or section", async ({ page, request }) => {
      await open(page, config.path);
      const origin = new URL(page.url()).origin;
      const hrefs = await page
        .locator("a[href]")
        .evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href));
      const internal = [...new Set(hrefs)].filter((h) => h.startsWith(origin));
      expect(internal.length, "page has internal links").toBeGreaterThan(0);
      const pageHtml = new Map<string, string>();
      for (const href of internal) {
        const url = new URL(href);
        const path = url.pathname.replace(/\/$/, "") || "/";
        expect(knownPaths.has(path), `${href} points to a page in site.config`).toBe(true);
        if (!url.hash) continue;
        if (!pageHtml.has(path)) {
          const res = await request.get(path);
          expect(res.status(), `${path} loads`).toBe(200);
          pageHtml.set(path, await res.text());
        }
        const id = decodeURIComponent(url.hash.slice(1));
        expect(pageHtml.get(path), `${href}: section id "${id}" exists`).toContain(`id="${id}"`);
      }
    });

    test("nothing wider than the screen", async ({ page }) => {
      await open(page, config.path);
      const result = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const clipped = (el: Element) => {
          for (let p = el.parentElement; p; p = p.parentElement) {
            const s = getComputedStyle(p);
            if (s.overflowX !== "visible" || s.overflow === "hidden") {
              const r = p.getBoundingClientRect();
              if (r.left >= -1 && r.right <= vw + 1) return true;
            }
          }
          return false;
        };
        const wide = [...document.body.querySelectorAll("*")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return false;
            return (r.right > vw + 1 || r.left < -1) && !clipped(el);
          })
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
        return { scrollWidth: document.documentElement.scrollWidth, vw, wide };
      });
      expect(result.scrollWidth, "no sideways scroll").toBeLessThanOrEqual(result.vw);
      expect(result.wide, "elements wider than the screen").toEqual([]);
    });

    test("footer: phone, service area, copyright year, nav links", async ({ page }) => {
      await open(page, config.path);
      const footer = page.getByRole("contentinfo");
      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toBeVisible();
      const phone = footer.getByRole("link", { name: business.phone.display });
      await expect(phone).toBeVisible();
      await expect(phone).toHaveAttribute("href", business.phone.href);
      await expect(footer).toContainText(business.areaServed.summary);
      await expect(footer).toContainText(`© ${new Date().getFullYear()}`);
      const footerNav = footer.getByRole("navigation");
      for (const item of nav) {
        const link = footerNav.getByRole("link", { name: item.label, exact: true });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("href", item.href);
      }
    });

    test("full-page screenshot for review", async ({ page }, testInfo) => {
      await open(page, config.path);
      // Scroll through once so scroll-driven reveals have run, then back to the top.
      await scrollToBottom(page);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForFunction(() => window.scrollY === 0);
      await page.screenshot({
        path: `test-results/screens/${testInfo.project.name}--${config.name}.png`,
        fullPage: true,
        animations: "disabled",
      });
    });
  });
}

test.describe("thank-you page", () => {
  test("heading, reply time, phone link, back to home", async ({ page }) => {
    await open(page, thankYou.path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("main")).toContainText(thankYou.replyLine);
    const call = page.getByRole("main").getByRole("link", { name: business.phone.display });
    await expect(call).toBeVisible();
    await expect(call).toHaveAttribute("href", business.phone.href);
    await page.getByRole("link", { name: thankYou.homeLink }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(pages[0]!.h1);
  });
});

test.describe("404 page", () => {
  test("unknown address shows a clear message and a working link home", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status(), "served with status 404").toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(notFound.message);
    await page.getByRole("link", { name: notFound.homeLink }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(pages[0]!.h1);
  });
});

// G. Accessibility and behavior: axe-core, keyboard, tap targets, reduced motion, no JavaScript.

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { business } from "../src/lib/business.ts";
import { cta, nav, pages, quoteForm } from "./site.config.ts";
import { open, screen, scrollToBottom } from "./helpers.ts";

for (const config of pages) {
  test(`axe: no serious or critical issues on ${config.path}`, async ({ page }, testInfo) => {
    const size = screen(testInfo);
    test.skip(
      !(size.isPhone || (size.width === 1440 && size.height === 900)),
      "phone and desktop sizes",
    );
    await open(page, config.path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    const serious = results.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map(
        (v) =>
          `${v.id} (${v.impact}): ${v.help} → ${v.nodes
            .map((n) => n.target.join(" "))
            .slice(0, 3)
            .join(" | ")}`,
      );
    expect(serious).toEqual([]);
  });
}

test.describe("keyboard", () => {
  /** Tabs through the page; returns what got focus, in order. */
  async function tabThrough(page: import("@playwright/test").Page, steps: number) {
    const seen: {
      name: string;
      tag: string;
      href: string | null;
      field: string | null;
      pos: number;
    }[] = [];
    for (let i = 0; i < steps; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const all = [...document.querySelectorAll("*")];
        return {
          name: (el.getAttribute("aria-label") || el.innerText || "").trim(),
          tag: el.tagName.toLowerCase(),
          href: el.getAttribute("href"),
          field: el.getAttribute("name"),
          pos: all.indexOf(el),
        };
      });
      if (!info) break;
      if (seen.some((s) => s.pos === info.pos)) break; // wrapped around
      seen.push(info);
    }
    return seen;
  }

  test("Tab reaches nav links, menu button, CTAs in page order", async ({ page }, testInfo) => {
    const size = screen(testInfo);
    await open(page, "/");
    const seen = await tabThrough(page, 60);
    expect(seen.length).toBeGreaterThan(5);
    if (size.usesMenu) {
      expect(
        seen.some((s) => s.name === "Open menu"),
        "menu button",
      ).toBe(true);
    } else {
      for (const item of nav) {
        expect(
          seen.some((s) => s.name === item.label && s.href === item.href),
          `nav "${item.label}"`,
        ).toBe(true);
      }
    }
    expect(
      seen.some((s) => s.name.includes(cta.call)),
      "Call Now",
    ).toBe(true);
    expect(
      seen.some((s) => s.name.includes(cta.quote)),
      "Get a Quote",
    ).toBe(true);
    // Sensible order: focus follows the page from top to bottom (no tabindex jumps).
    const positions = seen.map((s) => s.pos);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test("Tab reaches every quote form field in order", async ({ page }) => {
    await open(page, quoteForm.path);
    const seen = await tabThrough(page, 60);
    const fieldOrder = seen.map((s) => s.field).filter((f) => f && f !== quoteForm.honeypot);
    expect(fieldOrder).toEqual(quoteForm.fields.map((f) => f.name));
    expect(
      seen.some((s) => s.name === quoteForm.submitLabel),
      "submit button",
    ).toBe(true);
  });

  test("focus outline shows on keyboard focus only, not on load or mouse click", async ({
    page,
  }) => {
    await open(page, "/");
    const outline = () =>
      page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return { focused: false, visible: false };
        const s = getComputedStyle(el);
        return {
          focused: true,
          visible: s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0,
        };
      });
    expect((await outline()).visible, "no outline on load").toBe(false);
    // Mouse click on a FAQ question: no outline.
    await page.getByText(business.faqs[0]!.q, { exact: true }).click();
    expect((await outline()).visible, "no outline after a mouse click").toBe(false);
    await page.getByRole("link", { name: cta.call }).first().focus();
    await page.keyboard.press("Tab");
    const kb = await outline();
    expect(kb.focused && kb.visible, "outline on keyboard focus").toBe(true);
  });
});

test("phones: tap targets at least 44x44", async ({ page }, testInfo) => {
  test.skip(!screen(testInfo).isPhone, "phones only");
  for (const config of pages) {
    await open(page, config.path);
    const small = await page
      .locator("a, button, summary, input:not([type=hidden]), select, textarea")
      .evaluateAll((els) =>
        els
          .filter((el) => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0 || s.visibility === "hidden") return false;
            if (el.closest("[inert]")) return false;
            // Links inside a sentence are exempt (WCAG 2.5.8): inline, with text around them.
            if (s.display === "inline" && el.parentElement) {
              const sentence =
                el.parentElement.textContent?.replace(el.textContent ?? "", "").trim() ?? "";
              if (sentence.length > 0) return false;
            }
            return r.width < 44 || r.height < 44;
          })
          .map((el) => {
            const r = el.getBoundingClientRect();
            return `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`;
          }),
      );
    expect(small, `${config.path}: tap targets smaller than 44x44`).toEqual([]);
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  for (const config of pages) {
    test(`no animations run on ${config.path}`, async ({ page }) => {
      await open(page, config.path);
      await scrollToBottom(page);
      const running = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => {
            const timing = a.effect?.getComputedTiming();
            const duration = Number(timing?.duration ?? 0);
            return a.playState === "running" && duration > 1;
          })
          .map(
            (a) =>
              (a as CSSAnimation).animationName ??
              (a as CSSTransition).transitionProperty ??
              "animation",
          ),
      );
      expect(running).toEqual([]);
    });
  }
});

test.describe("JavaScript off", () => {
  test.use({ javaScriptEnabled: false });
  test("home: h1, phone number, services and FAQ answers are in the page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(pages[0]!.h1);
    await expect(
      page.getByText(business.phone.display).filter({ visible: true }).first(),
    ).toBeVisible();
    for (const s of business.services) {
      await expect(page.getByRole("heading", { name: s.name })).toBeVisible();
      await expect(page.getByText(s.description)).toBeVisible();
    }
    for (const f of business.faqs) {
      await expect(page.getByText(f.q, { exact: true })).toBeVisible();
      await expect(page.getByText(f.a, { exact: true })).toBeAttached();
    }
  });

  test("quote: every form field is in the page", async ({ page }) => {
    await page.goto(quoteForm.path);
    for (const f of quoteForm.fields)
      await expect(page.getByLabel(f.label, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: quoteForm.submitLabel })).toBeVisible();
  });
});

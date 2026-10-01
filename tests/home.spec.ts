// C. Homepage content and positioning. D. Calls (tel: links, sticky bottom bar).

import { expect, test, type Page } from "@playwright/test";
import { business } from "../src/lib/business.ts";
import { cta, faqSection, homeSections, pages, servicesSection } from "./site.config.ts";
import {
  actionBar,
  colorsOf,
  contrast,
  expectInFirstScreen,
  isTopmostAtCenter,
  open,
  screen,
  scrollToBottom,
} from "./helpers.ts";

const hero = (page: Page) => page.getByRole("region", { name: homeSections[0]!.heading });
const section = (page: Page, heading: string) =>
  page.getByRole("region", { name: heading, exact: true });

test.describe("hero", () => {
  test("who, what, where and how to contact are all in the first screen", async ({
    page,
  }, testInfo) => {
    const { height } = screen(testInfo);
    await open(page, "/");
    const h = hero(page);
    await expectInFirstScreen(page, h.getByRole("heading", { level: 1 }), height);
    await expectInFirstScreen(page, h.getByText(business.description), height);
    await expectInFirstScreen(page, h.getByRole("link", { name: cta.call }), height);
    await expectInFirstScreen(page, h.getByRole("link", { name: cta.quote }), height);
    await expectInFirstScreen(page, h.getByText(business.phone.display, { exact: true }), height);
  });

  test("hero height follows its content; the next section peeks in [PR #8]", async ({
    page,
  }, testInfo) => {
    const { width, height } = screen(testInfo);
    await open(page, "/");
    const box = (await hero(page).boundingBox())!;
    const heroBottom = box.y + box.height;
    if (width === 1440 && height === 900) {
      expect(heroBottom, "hero ends within 75% of a 1440x900 screen").toBeLessThanOrEqual(
        height * 0.75,
      );
    }
    // At every size the next section starts inside the first screen (at 1280x560 too).
    const next = section(page, homeSections[1]!.heading);
    const nextTop = (await next.boundingBox())!.y;
    expect(nextTop, "next section starts inside the first screen").toBeLessThan(height - 8);
  });

  test("Call Now stands out: contrast and not covered", async ({ page }) => {
    await open(page, "/");
    const call = hero(page).getByRole("link", { name: cta.call });
    await expect(call).toBeVisible();
    const colors = await colorsOf(call);
    const textContrast = Math.min(...colors.own.map((bg) => contrast(colors.text, bg)));
    expect(textContrast, "Call Now text vs its background (WCAG AA 4.5:1)").toBeGreaterThanOrEqual(
      4.5,
    );
    const edge = Math.min(
      ...colors.own.flatMap((own) => colors.behind.map((behind) => contrast(own, behind))),
    );
    expect(
      edge,
      "Call Now button vs the hero behind it (3:1, so it doesn't blend in)",
    ).toBeGreaterThanOrEqual(3);
    expect(await isTopmostAtCenter(call), "Call Now isn't covered by anything").toBe(true);
  });
});

test("services: one card per service in business.ts", async ({ page }) => {
  await open(page, "/");
  const cards = section(page, servicesSection).getByRole("article");
  await expect(cards).toHaveCount(business.services.length);
  for (const [i, service] of business.services.entries()) {
    expect(service.name.trim(), `service ${i + 1} name`).not.toBe("");
    expect(service.description.trim(), `service ${i + 1} description`).not.toBe("");
    const card = cards.nth(i);
    await expect(card.getByRole("heading")).toHaveText(service.name);
    await expect(card).toContainText(service.description);
  }
});

test.describe("FAQ", () => {
  test("every question opens to its answer; several can be open", async ({ page }) => {
    await open(page, "/");
    const faq = section(page, faqSection);
    await expect(faq.locator("details")).toHaveCount(business.faqs.length);
    for (const item of business.faqs) {
      expect(item.a.trim(), `answer to "${item.q}"`).not.toBe("");
      const answer = faq.getByText(item.a, { exact: true });
      await expect(answer).toBeHidden();
      await faq.getByText(item.q, { exact: true }).click();
      await expect(answer).toBeVisible();
    }
    // All still open at once.
    for (const item of business.faqs)
      await expect(faq.getByText(item.a, { exact: true })).toBeVisible();
  });
});

test("every homepage section is present, in order, with a heading and text", async ({ page }) => {
  await open(page, "/");
  const regions = page.getByRole("main").getByRole("region");
  const names = await regions.evaluateAll((els) =>
    els.map(
      (el) =>
        document.getElementById(el.getAttribute("aria-labelledby") ?? "")?.textContent?.trim() ??
        "",
    ),
  );
  expect(names).toEqual(homeSections.map((s) => s.heading));
  for (const config of homeSections) {
    const region = section(page, config.heading);
    await expect(region.getByRole("heading").first()).toHaveText(config.heading);
    if (config.id) await expect(region).toHaveAttribute("id", config.id);
    const text = (await region.innerText()).replace(config.heading, "").trim();
    expect(text.length, `"${config.heading}" has text besides its heading`).toBeGreaterThan(20);
  }
});

test.describe("calls", () => {
  for (const config of pages) {
    test(`every tel: link on ${config.path} uses the business phone`, async ({ page }) => {
      await open(page, config.path);
      const hrefs = await page
        .locator('a[href^="tel:"]')
        .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
      expect(hrefs.length, "has call links").toBeGreaterThan(0);
      for (const href of hrefs) expect(href).toBe(business.phone.href);
    });
  }

  test("phones: a call link in the first screen", async ({ page }, testInfo) => {
    test.skip(!screen(testInfo).isPhone, "phones only");
    await open(page, "/");
    const inView = await page.locator('a[href^="tel:"]').evaluateAll(
      (links) =>
        links.filter((a) => {
          const r = a.getBoundingClientRect();
          return r.width > 0 && r.top >= 0 && r.bottom <= window.innerHeight;
        }).length,
    );
    expect(inView, "tel: links fully inside the first screen").toBeGreaterThan(0);
  });

  test("phones: sticky Call Now / Get a Quote bar stays and doesn't hide the footer", async ({
    page,
  }, testInfo) => {
    test.skip(!screen(testInfo).isPhone, "phones only");
    for (const config of pages) {
      await open(page, config.path);
      await scrollToBottom(page);
      const bar = actionBar(page);
      await expect(bar).toBeInViewport({ ratio: 1 });
      await expect(bar.getByRole("link", { name: cta.call })).toHaveAttribute(
        "href",
        business.phone.href,
      );
      await expect(bar.getByRole("link", { name: cta.quote })).toHaveAttribute(
        "href",
        cta.quotePath,
      );
      const barTop = (await bar.boundingBox())!.y;
      const lastLine = page.getByRole("contentinfo").getByText(`© ${new Date().getFullYear()}`);
      const line = (await lastLine.boundingBox())!;
      expect(
        line.y + line.height,
        `${config.path}: footer's last line sits above the bar`,
      ).toBeLessThanOrEqual(barTop);
    }
  });

  test("desktop: no sticky bottom bar covering content", async ({ page }, testInfo) => {
    test.skip(!screen(testInfo).isDesktop, "desktop only");
    await open(page, "/");
    await expect(actionBar(page)).toBeHidden();
    const covering = await page.evaluate(
      () =>
        [...document.querySelectorAll("body *")].filter((el) => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return (
            s.position === "fixed" &&
            r.height > 0 &&
            r.bottom >= window.innerHeight - 1 &&
            s.visibility !== "hidden"
          );
        }).length,
    );
    expect(covering, "fixed elements at the bottom of the screen").toBe(0);
  });
});

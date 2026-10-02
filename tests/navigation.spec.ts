// B. Header and navigation: logo, desktop links, phone/tablet menu, sticky header.

import { expect, test, type Page } from "@playwright/test";
import { cta, desktopNavFrom, homeSections, nav, pages } from "./site.config.ts";
import { open, waitForHydration, waitForScrollEnd } from "./helpers.ts";

const home = pages[0]!;
const header = (page: Page) => page.getByRole("banner");
const menuButton = (page: Page) => header(page).getByRole("button", { name: /menu/i });

/** Checks a nav item took us to its page or scrolled its section into view. */
async function expectArrived(page: Page, href: string) {
  const [path, id] = href.split("#");
  await expect(page).toHaveURL(new RegExp(`${path === "/" ? "/" : path}(#${id ?? ""})?$`));
  if (id) {
    const section = page.locator(`[id="${id}"]`);
    await expect(section).toBeInViewport();
  } else {
    const config = pages.find((p) => p.path === path)!;
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(config.h1);
  }
}

test("logo / business name links to the home page", async ({ page }) => {
  await open(page, "/quote");
  const logo = header(page).getByRole("link").first();
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute("href", "/");
  await logo.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(home.h1);
});

test.describe("desktop navigation", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < desktopNavFrom, "desktop header links only");

  test("every nav item is visible and goes to its page or section", async ({ page }) => {
    await open(page, "/");
    const primary = header(page).getByRole("navigation", { name: "Primary navigation" });
    await expect(menuButton(page)).toBeHidden();
    await expect(header(page).getByRole("link", { name: cta.call })).toBeVisible();
    for (const item of nav) {
      await open(page, "/quote");
      const link = primary.getByRole("link", { name: item.label, exact: true });
      await expect(link).toBeVisible();
      await link.click();
      await expectArrived(page, item.href);
    }
  });
});

test.describe("phone and tablet menu", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= desktopNavFrom, "phones and tablets only");

  test("inline nav hidden; menu opens with every item and closes with X", async ({ page }) => {
    await open(page, "/");
    await expect(header(page).getByRole("navigation", { name: "Primary navigation" })).toBeHidden();
    const button = header(page).getByRole("button", { name: "Open menu" });
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "false");

    await button.click();
    const close = header(page).getByRole("button", { name: "Close menu" });
    await expect(close).toBeVisible();
    await expect(close).toHaveAttribute("aria-expanded", "true");
    // The close button shows an X icon.
    await expect(close.locator("svg")).toHaveClass(/lucide-x\b/);
    const menu = page.getByRole("navigation", { name: "Mobile navigation" });
    for (const item of nav) {
      await expect(
        menu.getByRole("link", { name: item.menuLabel ?? item.label, exact: true }),
      ).toBeVisible();
    }

    await close.click();
    await expect(header(page).getByRole("button", { name: "Open menu" })).toBeVisible();
    await expect(menu.getByRole("link").first()).toBeHidden();
    await expect(header(page).getByRole("button", { name: "Open menu" })).toBeFocused();
  });

  test("Escape closes the menu and focus returns to the menu button", async ({ page }) => {
    await open(page, "/");
    await header(page).getByRole("button", { name: "Open menu" }).click();
    await expect(header(page).getByRole("button", { name: "Close menu" })).toBeVisible();
    await page.keyboard.press("Escape");
    const button = header(page).getByRole("button", { name: "Open menu" });
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toBeFocused();
  });

  test("page behind the open menu doesn't scroll", async ({ page }) => {
    await open(page, "/");
    await header(page).getByRole("button", { name: "Open menu" }).click();
    await expect(header(page).getByRole("button", { name: "Close menu" })).toBeVisible();
    const locked = await page.evaluate(() =>
      [document.documentElement, document.body].some(
        (el) =>
          getComputedStyle(el).overflow === "hidden" || getComputedStyle(el).overflowY === "hidden",
      ),
    );
    expect(locked, "page scrolling is locked while the menu is open").toBe(true);
    await header(page).getByRole("button", { name: "Close menu" }).click();
    const unlocked = await page.evaluate(() =>
      [document.documentElement, document.body].every(
        (el) => getComputedStyle(el).overflowY !== "hidden",
      ),
    );
    expect(unlocked, "page scrolls again after closing").toBe(true);
  });

  for (const item of nav) {
    test(`tapping "${item.menuLabel ?? item.label}" navigates and closes the menu`, async ({
      page,
    }) => {
      await open(page, item.href === "/quote" ? "/" : "/quote");
      await header(page).getByRole("button", { name: "Open menu" }).click();
      const menu = page.getByRole("navigation", { name: "Mobile navigation" });
      await menu.getByRole("link", { name: item.menuLabel ?? item.label, exact: true }).click();
      await expectArrived(page, item.href);
      await expect(header(page).getByRole("button", { name: "Open menu" })).toBeVisible();
      await expect(menu.getByRole("link").first()).toBeHidden();
    });
  }
});

test("header stays visible on scroll and doesn't cover a section you jump to", async ({ page }) => {
  await open(page, "/");
  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: "instant" }),
  );
  await expect(header(page)).toBeInViewport();
  const box = await header(page).boundingBox();
  expect(box!.y, "header is stuck to the top").toBeLessThanOrEqual(1);

  for (const section of homeSections.filter((s) => s.id)) {
    await page.goto(`/#${section.id}`);
    await waitForHydration(page);
    const heading = page
      .locator(`[id="${section.id}"]`)
      .getByRole("heading", { name: section.heading })
      .first();
    await waitForScrollEnd(page);
    await expect(heading).toBeInViewport();
    const headerBottom =
      (await header(page).boundingBox())!.y + (await header(page).boundingBox())!.height;
    const headingTop = (await heading.boundingBox())!.y;
    expect(
      headingTop,
      `"${section.heading}" heading is below the sticky header`,
    ).toBeGreaterThanOrEqual(headerBottom - 1);
  }
});

// Shared helpers for the browser tests.

import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import { desktopNavFrom } from "./site.config.ts";

/** The screen size of the running project, and what the site should do at that size. */
export function screen(testInfo: TestInfo) {
  const viewport = testInfo.project.use.viewport ?? { width: 1280, height: 720 };
  const isPhone = viewport.width < 768;
  return {
    ...viewport,
    name: testInfo.project.name,
    isPhone,
    isTablet: !isPhone && viewport.width < desktopNavFrom,
    /** Phones and tablets: menu button instead of header links. */
    usesMenu: viewport.width < desktopNavFrom,
    isDesktop: viewport.width >= desktopNavFrom,
  };
}

/** Collects console errors, failed requests and error responses while a page is used. */
export function watchPage(page: Page) {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console error: ${msg.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));
  page.on("requestfailed", (request) => {
    problems.push(`request failed: ${request.url()} (${request.failure()?.errorText ?? "?"})`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  return problems;
}

/** Opens a page and waits until it's loaded and React has taken over (hydrated). */
export async function open(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: "load" });
  await waitForHydration(page);
  return response;
}

/** React attaches its internal keys to the DOM once it has hydrated the pre-rendered page. */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const el = document.querySelector("main") ?? document.body.firstElementChild;
    return !!el && Object.keys(el).some((key) => key.startsWith("__react"));
  });
}

/** The phone's sticky bottom bar ("Call or get a quote"). */
export function actionBar(page: Page) {
  return page.getByRole("region", { name: "Call or get a quote" });
}

/** Height of the viewport not covered by the phone's sticky bottom bar. */
export async function usableHeight(page: Page, height: number) {
  const bar = actionBar(page);
  if (!(await bar.isVisible())) return height;
  const box = await bar.boundingBox();
  return box ? box.y : height;
}

/** Asserts the element sits fully inside the first screen (above any sticky bottom bar). */
export async function expectInFirstScreen(page: Page, locator: Locator, height: number) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  const bottom = await usableHeight(page, height);
  expect(box, "element has a size").not.toBeNull();
  expect(box!.y, "top inside the first screen").toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height, "bottom inside the first screen").toBeLessThanOrEqual(bottom + 1);
}

/** Relative luminance contrast of two "rgb(r, g, b)" colors (WCAG). */
export function contrast(a: number[], b: number[]) {
  const lum = ([r = 0, g = 0, bl = 0]: number[]) => {
    const [R, G, B] = [r, g, bl].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * R! + 0.7152 * G! + 0.0722 * B!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/**
 * Text color, own background color and the colors behind the element (its nearest painted
 * ancestor: a solid color or every stop of a gradient), as [r, g, b]. Colors like oklch() are
 * converted through a canvas, the way the browser paints them.
 */
export async function colorsOf(locator: Locator) {
  return locator.evaluate((el) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const toRgb = (color: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0, a = 0] = ctx.getImageData(0, 0, 1, 1).data;
      return { rgb: [r, g, b], alpha: a / 255 };
    };
    const painted = (node: Element) => {
      const style = getComputedStyle(node);
      const stops = style.backgroundImage.match(
        /(oklch|oklab|rgba?|hsla?|lab|lch|color)\([^)]*\)/g,
      );
      if (style.backgroundImage.includes("gradient") && stops)
        return stops.map((c) => toRgb(c).rgb);
      const bg = toRgb(style.backgroundColor);
      return bg.alpha > 0.5 ? [bg.rgb] : null;
    };
    const style = getComputedStyle(el);
    let behind: number[][] = [[255, 255, 255]];
    for (let node = el.parentElement; node; node = node.parentElement) {
      const colors = painted(node);
      if (colors) {
        behind = colors;
        break;
      }
    }
    return {
      text: toRgb(style.color).rgb,
      own: painted(el) ?? behind,
      behind,
    };
  });
}

/** Whether the element is the topmost thing at its center point (not covered by anything). */
export async function isTopmostAtCenter(locator: Locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && (hit === el || el.contains(hit));
  });
}

/** Scrolls to the very bottom of the page and waits for it to settle. */
export async function scrollToBottom(page: Page) {
  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
  );
  await page.waitForFunction(
    () => Math.abs(window.scrollY + window.innerHeight - document.documentElement.scrollHeight) < 2,
  );
}

// E. Quote form: labels, types, validation, the Netlify submission, failure handling, honeypot.
// Every POST is intercepted in the browser: nothing ever reaches Netlify from these tests.

import { expect, test, type Page, type Route } from "@playwright/test";
import { business } from "../src/lib/business.ts";
import { quoteForm, thankYou } from "./site.config.ts";
import { open, screen, usableHeight } from "./helpers.ts";

const field = (page: Page, label: string) => page.getByLabel(label, { exact: true });
const submit = (page: Page) => page.getByRole("button", { name: quoteForm.submitLabel });

/** Intercepts form POSTs; returns the captured requests. */
async function interceptPosts(page: Page, handler: (route: Route) => Promise<void>) {
  const posts: { url: string; body: string; contentType: string }[] = [];
  await page.route(`**${quoteForm.endpoint}`, async (route) => {
    const request = route.request();
    if (request.method() !== "POST") return route.continue();
    posts.push({
      url: request.url(),
      body: request.postData() ?? "",
      contentType: (await request.allHeaders())["content-type"] ?? "",
    });
    await handler(route);
  });
  return posts;
}

async function fillValid(page: Page) {
  for (const f of quoteForm.fields) {
    const input = field(page, f.label);
    if (f.type === "select") await input.selectOption(f.valid);
    else await input.fill(f.valid);
  }
}

test.beforeEach(async ({ page }) => {
  await open(page, quoteForm.path);
});

test("every field has a visible label, the right type and autocomplete", async ({ page }) => {
  for (const f of quoteForm.fields) {
    const input = field(page, f.label);
    await expect(input, `"${f.label}" field`).toBeVisible();
    await expect(page.locator("label", { hasText: f.label }).first()).toBeVisible();
    await expect(input).toHaveAttribute("name", f.name);
    if (f.type === "select") expect(await input.evaluate((el) => el.tagName)).toBe("SELECT");
    else if (f.type === "textarea")
      expect(await input.evaluate((el) => el.tagName)).toBe("TEXTAREA");
    else await expect(input).toHaveAttribute("type", f.type);
    if (f.autocomplete) await expect(input).toHaveAttribute("autocomplete", f.autocomplete);
    if (f.required)
      expect(await input.evaluate((el) => (el as HTMLInputElement).required)).toBe(true);
  }
});

test("service dropdown starts on its placeholder", async ({ page }) => {
  const select = field(
    page,
    quoteForm.fields.find((f) => f.name === quoteForm.serviceField)!.label,
  );
  await expect(select).toHaveValue("");
  const selected = await select.evaluate(
    (el) => (el as HTMLSelectElement).selectedOptions[0]?.textContent,
  );
  expect(selected).toBe(quoteForm.servicePlaceholder);
  const options = await select.locator("option:not([value=''])").allTextContents();
  expect(options).toEqual(business.services.map((s) => s.name));
});

test("all fields share one height and style", async ({ page }) => {
  const styles = await Promise.all(
    quoteForm.fields.map(async (f) => ({
      type: f.type,
      label: f.label,
      ...(await field(page, f.label).evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          height: Math.round(el.getBoundingClientRect().height),
          look: [
            s.borderTopWidth,
            s.borderTopColor,
            s.borderRadius,
            s.fontSize,
            s.backgroundColor,
            s.paddingLeft,
          ].join(" "),
        };
      })),
    })),
  );
  const looks = new Set(styles.map((s) => s.look));
  expect([...looks], "one border, radius, font size, background and padding").toHaveLength(1);
  const singleLine = styles.filter((s) => s.type !== "textarea");
  expect(
    new Set(singleLine.map((s) => s.height)).size,
    `heights: ${singleLine.map((s) => `${s.label}=${s.height}`).join(", ")}`,
  ).toBe(1);
});

test("empty submit: an inline error on every required field, focus on the first, nothing sent", async ({
  page,
}) => {
  const posts = await interceptPosts(page, (route) => route.fulfill({ status: 200, body: "OK" }));
  await submit(page).click();
  const required = quoteForm.fields.filter((f) => f.required);
  for (const f of required) {
    const input = field(page, f.label);
    await expect(input, `"${f.label}" marked invalid`).toHaveAttribute("aria-invalid", "true");
    const describedBy = (await input.getAttribute("aria-describedby")) ?? "";
    const errorId = describedBy.split(" ").find((id) => id.endsWith("-error"));
    expect(errorId, `"${f.label}" error is linked with aria-describedby`).toBeTruthy();
    const error = page.locator(`[id="${errorId}"]`);
    await expect(error).toBeVisible();
    expect((await error.innerText()).trim().length, `"${f.label}" error text`).toBeGreaterThan(5);
  }
  await expect(field(page, required[0]!.label)).toBeFocused();
  expect(posts, "nothing was sent").toHaveLength(0);
  await expect(page).toHaveURL(new RegExp(`${quoteForm.path}$`));
});

test("wrong email and too-short phone show specific errors", async ({ page }) => {
  await fillValid(page);
  const checked = quoteForm.fields.filter((f) => f.invalid);
  expect(checked.length).toBeGreaterThan(0);
  for (const f of checked) await field(page, f.label).fill(f.invalid!.value);
  await submit(page).click();
  for (const f of checked) {
    const input = field(page, f.label);
    await expect(input).toHaveAttribute("aria-invalid", "true");
    const errorId = ((await input.getAttribute("aria-describedby")) ?? "")
      .split(" ")
      .find((id) => id.endsWith("-error"));
    await expect(page.locator(`[id="${errorId}"]`)).toHaveText(f.invalid!.error);
  }
});

test("valid submit sends everything Netlify needs, then shows our thank-you page [PR #11]", async ({
  page,
}) => {
  const posts = await interceptPosts(page, (route) => route.fulfill({ status: 200, body: "OK" }));
  await fillValid(page);
  await submit(page).click();
  await expect(page).toHaveURL(new RegExp(`${thankYou.path}$`));

  expect(posts).toHaveLength(1);
  const post = posts[0]!;
  expect(post.contentType).toContain("application/x-www-form-urlencoded");
  const body = new URLSearchParams(post.body);
  expect(body.get("form-name")).toBe(quoteForm.name);
  for (const f of quoteForm.fields) {
    expect(body.has(f.name), `${f.name} sent`).toBe(true);
    expect(body.get(f.name)?.trim(), `${f.name} not empty`).toBeTruthy();
  }
  expect(body.get(quoteForm.honeypot), "honeypot empty").toBe("");
  const subject = body.get(quoteForm.subject) ?? "";
  expect(subject.trim(), "email subject").not.toBe("");
  for (const name of quoteForm.subjectIncludes) {
    expect(subject, `subject includes the ${name}`).toContain(body.get(name) ?? "<missing>");
  }

  const firstName = quoteForm.fields.find((f) => f.name === "name")!.valid.split(/\s+/)[0]!;
  await expect(page.getByRole("heading", { level: 1 })).toContainText(firstName);
});

test("network failure: visible error, typed data kept, phone number offered", async ({ page }) => {
  await interceptPosts(page, (route) => route.abort("failed"));
  // The failed request is expected here; the page logs it as an error by design.
  await fillValid(page);
  await submit(page).click();
  const alert = page.getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(alert.getByRole("link", { name: business.phone.display })).toHaveAttribute(
    "href",
    business.phone.href,
  );
  await expect(page).toHaveURL(new RegExp(`${quoteForm.path}$`));
  for (const f of quoteForm.fields.filter((f) => f.type !== "tel")) {
    await expect(field(page, f.label), `${f.label} kept`).toHaveValue(f.valid);
  }
  const phone = quoteForm.fields.find((f) => f.type === "tel");
  if (phone) {
    const digits = (await field(page, phone.label).inputValue()).replace(/\D/g, "");
    expect(digits, "phone kept").toBe(phone.valid.replace(/\D/g, ""));
  }
});

test("honeypot is hidden from people and not reachable with Tab", async ({ page }) => {
  const honeypot = page.locator(`[name="${quoteForm.honeypot}"]`);
  await expect(honeypot).toBeHidden();
  await expect(honeypot).toHaveAttribute("tabindex", "-1");
  // Tab through the whole form: the honeypot never gets focus.
  await field(page, quoteForm.fields[0]!.label).focus();
  for (let i = 0; i < quoteForm.fields.length + 3; i++) {
    const name = await page.evaluate(() => document.activeElement?.getAttribute("name"));
    expect(name).not.toBe(quoteForm.honeypot);
    await page.keyboard.press("Tab");
  }
});

test("phones: the form starts within the first screen", async ({ page }, testInfo) => {
  const size = screen(testInfo);
  test.skip(!size.isPhone, "phones only");
  const first = field(page, quoteForm.fields[0]!.label);
  const box = (await first.boundingBox())!;
  expect(box.y + box.height, "first field visible without scrolling").toBeLessThanOrEqual(
    await usableHeight(page, size.height),
  );
});

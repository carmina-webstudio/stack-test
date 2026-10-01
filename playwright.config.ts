// Browser tests (`npm run test:e2e`) against the built site, served locally from .output/public.
// Every test runs in Chromium and WebKit (iPhone Safari's engine) at five screen sizes.
// Screenshots and the HTML report go to test-results/ and playwright-report/ (both gitignored,
// never committed).

import { defineConfig, type Project } from "@playwright/test";

const PORT = 4173;

// Screen sizes. Phone and tablet are touch devices; the rest use a mouse.
const sizes = [
  { name: "phone", viewport: { width: 375, height: 812 }, touch: true },
  { name: "tablet", viewport: { width: 768, height: 1024 }, touch: true },
  { name: "laptop-short", viewport: { width: 1280, height: 560 }, touch: false },
  { name: "desktop", viewport: { width: 1440, height: 900 }, touch: false },
  { name: "wide", viewport: { width: 2880, height: 1620 }, touch: false },
];

// Local runs can point at an already-installed Chromium (PW_CHROMIUM_PATH) instead of
// downloading one. CI installs the browsers with `npx playwright install`.
const chromiumPath = process.env["PW_CHROMIUM_PATH"];
const browsers = (process.env["PW_BROWSERS"] ?? "chromium,webkit").split(",");

const projects: Project[] = browsers.flatMap((browserName) =>
  sizes.map((size) => ({
    name: `${browserName}-${size.name}`,
    use: {
      browserName: browserName as "chromium" | "webkit",
      viewport: size.viewport,
      hasTouch: size.touch,
      isMobile: size.touch,
      deviceScaleFactor: size.touch ? 2 : 1,
      ...(browserName === "chromium" && chromiumPath
        ? { launchOptions: { executablePath: chromiumPath } }
        : {}),
    },
  })),
);

export default defineConfig({
  testDir: "tests",
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: 0,
  workers: process.env["CI"] ? 4 : "50%",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env["CI"]
    ? [["list"], ["html", { open: "never" }], ["github"]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    // Only for sandboxes behind an HTTPS-inspecting proxy (fonts fail there otherwise).
    ignoreHTTPSErrors: !!process.env["PW_IGNORE_HTTPS_ERRORS"],
    screenshot: "only-on-failure",
  },
  projects,
  webServer: {
    command: `node --experimental-strip-types --disable-warning=ExperimentalWarning tests/static-server.ts`,
    env: { PORT: String(PORT) },
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env["CI"],
    timeout: 20_000,
  },
});

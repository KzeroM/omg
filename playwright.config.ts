import { defineConfig, devices } from "@playwright/test";

// LOCAL:  BASE_URL=http://localhost:3000 npx playwright test
// PROD:   npx playwright test  (defaults to production)
const BASE_URL = process.env.BASE_URL ?? "https://omg-iota.vercel.app";
const IS_LOCAL = BASE_URL.includes("localhost");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: IS_LOCAL ? 0 : 1,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/e2e/report" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    headless: true,
    actionTimeout: IS_LOCAL ? 8000 : 15000,
    navigationTimeout: IS_LOCAL ? 15000 : 30000,
  },
  projects: [
    {
      name: "desktop",
      testMatch: ["**/*.spec.ts", "**/desktop/**/*.spec.ts"],
      testIgnore: ["**/mobile/**"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testMatch: ["**/mobile/**/*.spec.ts"],
      use: { ...devices["Pixel 5"] },
    },
  ],
});

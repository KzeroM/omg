import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/e2e/report" }]],
  use: {
    baseURL: "https://omg-iota.vercel.app",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    headless: true,
    actionTimeout: 10000,
    navigationTimeout: 20000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});

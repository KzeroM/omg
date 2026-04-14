import { test, expect } from "@playwright/test";

// 로그인 헬퍼
async function login(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 로그인 버튼 찾기
  const loginBtn = page.locator("text=로그인").or(page.locator("text=Login")).first();
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
  }

  await page.fill("input[type='email']", "zeromo2000@gmail.com");
  await page.fill("input[type='password']", process.env.TEST_PASSWORD ?? "");
  await page.locator("button[type='submit']").or(page.locator("text=로그인").last()).click();
  await page.waitForLoadState("networkidle");
}

test.describe("Settings 페이지", () => {
  test("비로그인 접근 시 홈으로 리다이렉트", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    // 비로그인이면 홈(/)으로 리다이렉트되거나 로그인 UI 표시
    const url = page.url();
    const isRedirected = url === "https://omg-iota.vercel.app/" || url.endsWith("/");
    const hasLoginUI = await page.locator("text=로그인").first().isVisible();
    expect(isRedirected || hasLoginUI).toBeTruthy();
  });

  test("페이지 기본 요소 확인 (로그인 없이 구조 파악)", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Settings 페이지 (로그인)", () => {
  test.skip(!process.env.TEST_PASSWORD, "TEST_PASSWORD 환경변수 필요");

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("닉네임 표시 확인", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=닉네임").first()).toBeVisible({ timeout: 10000 });
  });

  test("bio 입력 필드 표시", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("textarea").first()).toBeVisible({ timeout: 10000 });
  });

  test("소셜링크 입력 필드 표시 (4개)", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    const socialInputs = page.locator("input[placeholder*='instagram'], input[placeholder*='twitter'], input[placeholder*='youtube'], input[placeholder*='soundcloud']");
    const count = await socialInputs.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("bio 300자 초과 입력 시 경고 표시", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    const textarea = page.locator("textarea").first();
    await textarea.fill("a".repeat(301));
    // 에러 메시지 또는 저장 버튼 disabled 확인
    const saveBtn = page.locator("button:has-text('저장')").first();
    await expect(saveBtn).toBeDisabled({ timeout: 3000 });
  });
});

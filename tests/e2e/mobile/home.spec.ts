import { test, expect } from "@playwright/test";

test.describe("모바일 — 홈 페이지", () => {
  test("BottomNav 표시 / Sidebar 숨김", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // BottomNav: 하단 고정 nav (lg:hidden → 모바일에서 표시)
    const bottomNav = page.locator("nav.fixed.bottom-0");
    await expect(bottomNav).toBeVisible();

    // BottomNav 탭 4개 확인
    await expect(bottomNav.getByText("홈")).toBeVisible();
    await expect(bottomNav.getByText("차트")).toBeVisible();
    await expect(bottomNav.getByText("검색")).toBeVisible();
    await expect(bottomNav.getByText("마이페이지")).toBeVisible();

    // Sidebar: lg:flex → 모바일에서 숨김
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeHidden();
  });

  test("트랙 목록 로딩", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const track = page.locator("li").filter({ hasText: /.+/ }).first();
    await expect(track).toBeVisible({ timeout: 15000 });
  });

  test("BottomNav 차트 탭 → /chart 이동", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const bottomNav = page.locator("nav.fixed.bottom-0");
    await bottomNav.getByText("차트").click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/chart/);
  });

  test("BottomNav 검색 탭 → /search 이동", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("nav.fixed.bottom-0").getByText("검색").click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/search/);
  });

  test("BottomNav 마이페이지 탭 → /my 이동 또는 로그인 유도", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("nav.fixed.bottom-0").getByText("마이페이지").click();
    await page.waitForLoadState("networkidle");
    // 비로그인: /my 리다이렉트 또는 로그인 모달
    const onMyPage = page.url().includes("/my");
    const loginModal = page.locator("text=로그인");
    const isRedirected = onMyPage || await loginModal.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isRedirected).toBeTruthy();
  });

  test("트랙 클릭 → PlayerBar 상단 위에 표시 (bottom-14)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const track = page.locator("li[role='button']").first();
    await expect(track).toBeVisible({ timeout: 15000 });
    await track.click();
    // PlayerBar footer: bottom-14 (모바일), audio 연결 확인
    await expect(page.locator("audio")).toBeAttached({ timeout: 8000 });
    const footer = page.locator("footer.fixed");
    await expect(footer).toBeVisible();
  });

  test("비로그인 상태에서 로그인 버튼 표시", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const loginBtn = page.getByRole("button", { name: "로그인" });
    await expect(loginBtn).toBeVisible();
  });
});

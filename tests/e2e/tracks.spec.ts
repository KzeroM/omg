import { test, expect } from "@playwright/test";

test.describe("트랙 재생 및 플레이어", () => {
  test("트랙 클릭 시 오디오 요소 생성", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const track = page.locator("li[role='button']").first();
    await expect(track).toBeVisible({ timeout: 15000 });
    await track.click();
    await expect(page.locator("audio")).toBeAttached({ timeout: 8000 });
  });

  test("검색 기능 동작 (결과 필터링)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const searchInput = page.locator("input[placeholder*='검색']").first();
    if (await searchInput.isVisible()) {
      const before = await page.locator("li[role='button']").count();
      await searchInput.fill("zzzznotexist");
      await page.waitForTimeout(300);
      await expect(page.locator("text=검색 결과가 없습니다")).toBeVisible({ timeout: 5000 });
      await searchInput.fill("");
      await page.waitForTimeout(300);
      const after = await page.locator("li[role='button']").count();
      expect(after).toBe(before);
    }
  });

  test("좋아요 버튼 표시", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("li[role='button']").first()).toBeVisible({ timeout: 15000 });
    // 트랙 행 안의 SVG 버튼들 (LikeButton, ShareButton)
    const buttons = page.locator("li[role='button'] button");
    await expect(buttons.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("차트 섹션", () => {
  test("차트 항목 표시", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // 차트 섹션 헤더
    await expect(page.locator("text=New Releases").or(page.locator("text=최신 등록 곡")).first()).toBeVisible({ timeout: 10000 });
  });

  test("차트 트랙 클릭 → 재생", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const track = page.locator("li[role='button']").first();
    await expect(track).toBeVisible({ timeout: 15000 });
    await track.click();
    await expect(page.locator("audio")).toBeAttached({ timeout: 8000 });
  });
});

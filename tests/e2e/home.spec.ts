import { test, expect } from "@playwright/test";

test.describe("홈 페이지", () => {
  test("페이지 로딩 및 핵심 섹션 표시", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=최신 등록 곡")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "곡 올리기" })).toBeVisible();
  });

  test("비로그인 상태에서 트랙 목록 표시", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // NewReleases 트랙: li[role='button'] or li with cursor-pointer
    const trackList = page.locator("#new-releases li, section li").first();
    await expect(trackList).toBeVisible({ timeout: 15000 });
  });

  test("비로그인 상태에서 업로드 버튼 클릭 시 AuthModal 표시", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "곡 올리기" }).click();
    await expect(page.locator("text=이메일").or(page.locator("text=로그인")).first()).toBeVisible({ timeout: 5000 });
  });

  test("아티스트 링크 클릭 시 아티스트 페이지 이동", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const artistLink = page.locator("a[href^='/artist/']").first();
    await expect(artistLink).toBeVisible({ timeout: 15000 });
    const href = await artistLink.getAttribute("href");
    if (href) {
      await artistLink.click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(new RegExp("/artist/"));
    }
  });

  test("트랙 클릭 시 재생 시작", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // li[role='button'] — NewReleases 트랙 아이템
    const track = page.locator("li[role='button']").first();
    await expect(track).toBeVisible({ timeout: 15000 });
    await track.click();
    // PlayerBar 하단에 나타남 — audio 요소 또는 재생 버튼
    await expect(page.locator("audio")).toBeAttached({ timeout: 8000 });
  });
});

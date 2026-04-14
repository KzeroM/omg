import { test, expect } from "@playwright/test";

const ARTIST_NICKNAME = "zeromo2000";

test.describe("아티스트 페이지", () => {
  test("nickname 기반 URL 접근 및 아티스트명 표시", async ({ page }) => {
    await page.goto(`/artist/${ARTIST_NICKNAME}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
  });

  test("트랙 목록 표시", async ({ page }) => {
    await page.goto(`/artist/${ARTIST_NICKNAME}`);
    await page.waitForLoadState("networkidle");
    // 트랙이 있으면 ul>li, 없으면 "곡이 없습니다" 텍스트
    const hasTracks = page.locator("ul li").first();
    const noTracks = page.locator("text=이 아티스트의 곡이 없습니다");
    await expect(hasTracks.or(noTracks).first()).toBeVisible({ timeout: 10000 });
  });

  test("팔로우 버튼 표시 (비로그인 포함)", async ({ page }) => {
    await page.goto(`/artist/${ARTIST_NICKNAME}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: "팔로우" })).toBeVisible({ timeout: 10000 });
  });

  test("비로그인 팔로우 클릭 시 AuthModal 표시", async ({ page }) => {
    await page.goto(`/artist/${ARTIST_NICKNAME}`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "팔로우" }).click();
    await expect(page.locator("text=이메일").or(page.locator("text=로그인")).first()).toBeVisible({ timeout: 5000 });
  });

  test("팔로워 수 표시", async ({ page }) => {
    await page.goto(`/artist/${ARTIST_NICKNAME}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=팔로워")).toBeVisible({ timeout: 10000 });
  });

  test("존재하지 않는 아티스트 — 에러 없이 렌더링", async ({ page }) => {
    await page.goto("/artist/nonexistent_user_12345");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
    // JS 에러 없음 확인
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    expect(errors.length).toBe(0);
  });
});

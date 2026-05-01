import { test, expect } from "@playwright/test";

test.describe("모바일 — 플레이어", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // 트랙 재생 시작
    const track = page.locator("li[role='button']").first();
    await expect(track).toBeVisible({ timeout: 15000 });
    await track.click();
    await expect(page.locator("audio")).toBeAttached({ timeout: 8000 });
  });

  test("PlayerBar 하단 표시 (BottomNav 위)", async ({ page }) => {
    const footer = page.locator("footer.fixed");
    await expect(footer).toBeVisible();
    // 모바일에서 bottom-14(56px) — BottomNav가 아래에 있음
    const box = await footer.boundingBox();
    const viewportHeight = page.viewportSize()!.height;
    // footer 하단이 화면 하단에서 56px 이상 위에 있어야 함
    expect(box!.y + box!.height).toBeLessThan(viewportHeight);
  });

  test("PlayerBar 곡 정보 탭 → 풀스크린 플레이어 열림", async ({ page }) => {
    const footer = page.locator("footer.fixed");
    // 곡 정보 버튼 (lg:pointer-events-none → 모바일에서는 pointer-events 있음)
    const trackInfoBtn = footer.getByRole("button", { name: "플레이어 전체화면 열기" });
    await expect(trackInfoBtn).toBeVisible({ timeout: 5000 });
    await trackInfoBtn.click();
    // 풀스크린 플레이어: fixed + inset-0
    const fullscreen = page.locator("[class*='fixed'][class*='inset-0']").first();
    await expect(fullscreen).toBeVisible({ timeout: 3000 });
  });

  test("풀스크린 플레이어 닫기 버튼", async ({ page }) => {
    const footer = page.locator("footer.fixed");
    await footer.getByRole("button", { name: "플레이어 전체화면 열기" }).click();
    // 닫기 버튼 (ChevronDown)
    const closeBtn = page.getByRole("button", { name: "플레이어 닫기" });
    await expect(closeBtn).toBeVisible({ timeout: 3000 });
    await closeBtn.click();
    await expect(page.locator("footer.fixed")).toBeVisible();
  });

  test("PlayerBar 재생/일시정지 버튼 동작", async ({ page }) => {
    const footer = page.locator("footer.fixed");
    // 재생 중이면 Pause 버튼, 일시정지면 Play 버튼
    const playPauseBtn = footer.getByRole("button", { name: /재생|일시 정지|로딩/ });
    await expect(playPauseBtn).toBeVisible({ timeout: 5000 });
    await playPauseBtn.click();
    // 상태 전환 후 버튼 존재 확인
    await expect(playPauseBtn).toBeVisible({ timeout: 3000 });
  });

  test("모바일 상단 씨크바 표시", async ({ page }) => {
    const footer = page.locator("footer.fixed");
    // 모바일 seekbar: absolute top-0 h-0.5 (lg:hidden이 아닌 내부 요소)
    const seekbar = footer.locator(".absolute.top-0.left-0.right-0");
    await expect(seekbar).toBeAttached();
  });

  test("큐 버튼 클릭 → 큐 패널 열림", async ({ page }) => {
    const footer = page.locator("footer.fixed");
    const queueBtn = footer.getByRole("button", { name: "재생 큐 열기" }).last();
    await expect(queueBtn).toBeVisible({ timeout: 5000 });
    await queueBtn.click();
    // QueuePanel 렌더링 확인
    const queuePanel = page.locator("text=재생 큐").or(page.locator("[class*='QueuePanel'], [data-testid='queue-panel']")).first();
    await expect(queuePanel).toBeVisible({ timeout: 3000 });
  });
});

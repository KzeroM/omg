/**
 * FAC-20 — toggleTrackLike / getUserLikedTrackIds 유닛 테스트
 * framework: Vitest
 * supabase client는 vi.mock으로 모킹
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Supabase client 모킹 ──────────────────────────────────────────────────────
// tracks.ts가 `@/utils/supabase/client`의 createClient를 사용하므로 해당 모듈을 mock.
vi.mock("@/utils/supabase/client", () => {
  const mockRpc = vi.fn();
  const mockFrom = vi.fn();

  const supabase = {
    rpc: mockRpc,
    from: mockFrom,
  };

  return { createClient: () => supabase };
});

// ── 모킹된 client 참조 (각 테스트에서 구현 주입) ─────────────────────────────
import { createClient } from "@/utils/supabase/client";
import { getUserLikedTrackIds, toggleTrackLike } from "@/utils/supabase/tracks";

// ────────────────────────────────────────────────────────────────────────────
// 헬퍼: createClient()가 반환하는 mock supabase 객체 접근
// ────────────────────────────────────────────────────────────────────────────
function getMockSupabase() {
  return createClient() as ReturnType<typeof createClient> & {
    rpc: ReturnType<typeof vi.fn>;
    from: ReturnType<typeof vi.fn>;
  };
}

// ============================================================================
// getUserLikedTrackIds
// ============================================================================
describe("getUserLikedTrackIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("빈 userId를 전달하면 빈 Set을 반환한다", async () => {
    const result = await getUserLikedTrackIds("");
    expect(result).toEqual(new Set());
  });

  it("Supabase 쿼리 성공 시 track_id Set을 반환한다", async () => {
    const mockSupabase = getMockSupabase();
    const fakeData = [{ track_id: "track-aaa" }, { track_id: "track-bbb" }];

    // from("track_likes").select("track_id").eq("user_id", userId)
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: fakeData, error: null }),
      }),
    });

    const result = await getUserLikedTrackIds("user-123");
    expect(result).toEqual(new Set(["track-aaa", "track-bbb"]));
    expect(result.size).toBe(2);
  });

  it("Supabase 에러 시 빈 Set을 반환한다", async () => {
    const mockSupabase = getMockSupabase();

    (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
      }),
    });

    const result = await getUserLikedTrackIds("user-123");
    expect(result).toEqual(new Set());
  });

  it("data가 빈 배열이면 빈 Set을 반환한다", async () => {
    const mockSupabase = getMockSupabase();

    (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    const result = await getUserLikedTrackIds("user-123");
    expect(result).toEqual(new Set());
    expect(result.size).toBe(0);
  });
});

// ============================================================================
// toggleTrackLike
// ============================================================================
describe("toggleTrackLike", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upload- prefix 트랙은 null을 반환하고 RPC를 호출하지 않는다", async () => {
    const mockSupabase = getMockSupabase();

    const result = await toggleTrackLike("upload-some-track");
    expect(result).toBeNull();
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it("RPC 성공 시 { liked, like_count } 객체를 반환한다 — 좋아요 추가 케이스", async () => {
    const mockSupabase = getMockSupabase();
    const rpcResponse = { liked: true, like_count: 5 };

    (mockSupabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: rpcResponse,
      error: null,
    });

    const result = await toggleTrackLike("track-uuid-123");
    expect(result).toEqual({ liked: true, like_count: 5 });
    expect(mockSupabase.rpc).toHaveBeenCalledWith("toggle_track_like", {
      p_track_id: "track-uuid-123",
    });
  });

  it("RPC 성공 시 { liked, like_count } 객체를 반환한다 — 좋아요 취소 케이스", async () => {
    const mockSupabase = getMockSupabase();
    const rpcResponse = { liked: false, like_count: 4 };

    (mockSupabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: rpcResponse,
      error: null,
    });

    const result = await toggleTrackLike("track-uuid-123");
    expect(result).toEqual({ liked: false, like_count: 4 });
  });

  it("RPC 에러 시 null을 반환한다", async () => {
    const mockSupabase = getMockSupabase();

    (mockSupabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: new Error("RPC error"),
    });

    const result = await toggleTrackLike("track-uuid-123");
    expect(result).toBeNull();
  });

  it("RPC data가 null이면 null을 반환한다", async () => {
    const mockSupabase = getMockSupabase();

    (mockSupabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await toggleTrackLike("track-uuid-123");
    expect(result).toBeNull();
  });

  it("like_count가 0일 때도 정상 반환된다 (0을 falsy 취급하지 않음)", async () => {
    const mockSupabase = getMockSupabase();
    const rpcResponse = { liked: false, like_count: 0 };

    (mockSupabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: rpcResponse,
      error: null,
    });

    const result = await toggleTrackLike("track-uuid-123");
    expect(result).toEqual({ liked: false, like_count: 0 });
    // like_count가 0이어도 null이 아님을 검증
    expect(result).not.toBeNull();
  });
});

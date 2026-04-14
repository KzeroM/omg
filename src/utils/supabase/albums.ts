/**
 * FAC-51: albums 관련 Supabase 유틸 함수
 * Dev 구현용 stub — 함수 시그니처 + JSDoc 확정, 구현은 Dev가 채울 것
 */

import { createClient } from "./client";
import type {
  DbAlbum,
  AlbumWithTracks,
  CreateAlbumRequest,
  UpdateAlbumRequest,
  ManageAlbumTracksResult,
  AlbumCoverType,
} from "@/types/album";

// createClient()는 각 함수 내부에서 호출 (tracks.ts 패턴 준수)

// ============================================================
// 앨범 조회
// ============================================================

/**
 * 특정 유저의 앨범 목록을 최신순으로 반환합니다.
 * 비로그인 포함 누구나 조회 가능 (RLS: SELECT USING(true)).
 *
 * @param userId - 앨범 소유자의 auth.users.id
 * @returns DbAlbum[] (없으면 빈 배열)
 */
export async function getAlbumsByUserId(userId: string): Promise<DbAlbum[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as DbAlbum[];
}

/**
 * 앨범 단건 + 트랙 목록(position 순)을 반환합니다.
 *
 * 구현 힌트:
 *   - albums 테이블 SELECT
 *   - album_tracks JOIN tracks: select("*, album_tracks(position, added_at, tracks(id, title, artist, file_path))")
 *   - album_tracks를 position ASC 정렬
 *
 * @param albumId - albums.id (UUID)
 * @returns AlbumWithTracks | null (앨범 없으면 null)
 */
export async function getAlbumWithTracks(
  albumId: string
): Promise<AlbumWithTracks | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("albums")
    .select(
      "*, album_tracks(position, added_at, track_id, tracks(id, title, artist, file_path))"
    )
    .eq("id", albumId)
    .single();

  if (error || !data) return null;

  const album = data as Record<string, unknown>;
  const albumTracks = (album.album_tracks as Record<string, unknown>[]) || [];

  // Sort album_tracks by position
  albumTracks.sort(
    (a, b) => (a.position as number) - (b.position as number)
  );

  return {
    id: album.id as string,
    user_id: album.user_id as string,
    title: album.title as string,
    description: (album.description as string | null) ?? null,
    cover_type: album.cover_type as AlbumCoverType,
    cover_image_path: (album.cover_image_path as string | null) ?? null,
    created_at: album.created_at as string,
    updated_at: album.updated_at as string,
    tracks: albumTracks.map((at) => {
      const track = Array.isArray(at.tracks)
        ? at.tracks[0]
        : (at.tracks as Record<string, unknown> | undefined);
      return {
        track_id: at.track_id as string,
        position: at.position as number,
        added_at: at.added_at as string,
        title: (track?.title as string | null) ?? null,
        artist: (track?.artist as string | null) ?? null,
        file_path: (track?.file_path as string) ?? "",
      };
    }),
  };
}

// ============================================================
// 앨범 CUD (로그인 필수)
// ============================================================

/**
 * 새 앨범을 생성합니다. 로그인 필수.
 *
 * 구현 힌트:
 *   - auth.getUser()로 user_id 확보
 *   - supabase.from("albums").insert({ user_id, ...payload }).select().single()
 *
 * @param payload - CreateAlbumRequest
 * @returns 생성된 DbAlbum
 * @throws 미로그인 시 Error("로그인이 필요합니다.")
 */
export async function createAlbum(payload: CreateAlbumRequest): Promise<DbAlbum> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabase
    .from("albums")
    .insert({
      user_id: user.id,
      title: payload.title,
      description: payload.description ?? null,
      cover_type: payload.cover_type ?? "gradient",
      cover_image_path: payload.cover_image_path ?? null,
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error("앨범 생성 실패");
  return data as DbAlbum;
}

/**
 * 앨범 메타데이터(제목/설명/커버)를 수정합니다. 본인 앨범만 가능 (RLS).
 *
 * 구현 힌트:
 *   - supabase.from("albums").update(payload).eq("id", albumId).eq("user_id", user.id).select().single()
 *
 * @param albumId - 수정할 albums.id
 * @param payload - UpdateAlbumRequest
 * @returns 수정된 DbAlbum
 */
export async function updateAlbum(
  albumId: string,
  payload: UpdateAlbumRequest
): Promise<DbAlbum> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabase
    .from("albums")
    .update(payload)
    .eq("id", albumId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) throw error ?? new Error("앨범 수정 실패");
  return data as DbAlbum;
}

/**
 * 앨범을 삭제합니다. CASCADE로 album_tracks도 자동 삭제.
 *
 * 구현 힌트:
 *   - supabase.from("albums").delete().eq("id", albumId).eq("user_id", user.id)
 *
 * @param albumId - 삭제할 albums.id
 */
export async function deleteAlbum(albumId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { error } = await supabase
    .from("albums")
    .delete()
    .eq("id", albumId)
    .eq("user_id", user.id);

  if (error) throw error;
}

// ============================================================
// 앨범-트랙 관계 관리 (SECURITY DEFINER RPC 경유)
// ============================================================

/**
 * 앨범에 트랙을 추가합니다. SECURITY DEFINER RPC `manage_album_tracks` 경유.
 * 이미 추가된 트랙이면 position만 업데이트 (ON CONFLICT DO UPDATE).
 *
 * @param albumId  - 대상 앨범 UUID
 * @param trackId  - 추가할 트랙 UUID
 * @param position - 앨범 내 순서 (0-based)
 * @returns ManageAlbumTracksResult
 */
export async function addTrackToAlbum(
  albumId: string,
  trackId: string,
  position: number
): Promise<ManageAlbumTracksResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("manage_album_tracks", {
    p_album_id: albumId,
    p_track_id: trackId,
    p_action: "add",
    p_position: position,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return (data as ManageAlbumTracksResult) || {
    success: true,
    action: "added",
  };
}

/**
 * 앨범에서 트랙을 제거합니다. SECURITY DEFINER RPC `manage_album_tracks` 경유.
 *
 * @param albumId - 대상 앨범 UUID
 * @param trackId - 제거할 트랙 UUID
 * @returns ManageAlbumTracksResult
 */
export async function removeTrackFromAlbum(
  albumId: string,
  trackId: string
): Promise<ManageAlbumTracksResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("manage_album_tracks", {
    p_album_id: albumId,
    p_track_id: trackId,
    p_action: "remove",
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return (data as ManageAlbumTracksResult) || {
    success: true,
    action: "removed",
  };
}

/**
 * 앨범 내 트랙 순서를 일괄 재정렬합니다.
 * trackIds 배열 인덱스 = 새 position 값.
 *
 * 구현 힌트:
 *   - trackIds.forEach((trackId, idx) => addTrackToAlbum(albumId, trackId, idx))
 *   - Promise.all로 병렬 처리
 *
 * @param albumId  - 대상 앨범 UUID
 * @param trackIds - 새 순서로 정렬된 track UUID 배열
 */
export async function reorderAlbumTracks(
  albumId: string,
  trackIds: string[]
): Promise<void> {
  const promises = trackIds.map((trackId, idx) =>
    addTrackToAlbum(albumId, trackId, idx)
  );
  const results = await Promise.all(promises);
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) throw new Error(`${failures.length}개 트랙 순서 변경 실패`);
}

// ============================================================
// 싱글 조회 유틸
// ============================================================

/**
 * 유저의 싱글 트랙 목록을 반환합니다.
 * 싱글 = 어떤 album_tracks 행에도 없는 tracks.
 *
 * 구현 힌트:
 *   - supabase.from("tracks").select("id, title, artist, file_path, created_at")
 *       .eq("user_id", userId)
 *       .not("id", "in", subquery) 는 PostgREST 미지원
 *   - 대신: tracks 목록 + album_tracks 목록을 각각 fetch 후 클라이언트 사이드 필터
 *     또는 RPC로 처리
 *
 * @param userId - 조회할 유저 UUID
 * @returns 싱글 트랙 DbTrack[]
 */
export async function getSingleTracksByUserId(
  userId: string
): Promise<import("@/types/player").DbTrack[]> {
  const supabase = createClient();

  // Fetch all tracks for the user
  const { data: tracks, error: tracksError } = await supabase
    .from("tracks")
    .select("id, user_id, artist_id, file_path, title, artist, created_at, like_count, play_count, users!user_id(artist_tier)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (tracksError || !tracks) return [];

  // Fetch all album_tracks to get track IDs already in albums
  const { data: albumTracks, error: albumTracksError } = await supabase
    .from("album_tracks")
    .select("track_id");

  if (albumTracksError || !albumTracks) return tracks as import("@/types/player").DbTrack[];

  // Get set of track IDs in albums
  const tracksInAlbums = new Set(albumTracks.map((at) => at.track_id as string));

  // Filter out tracks that are in albums
  const singleTracks = tracks.filter(
    (track) => !tracksInAlbums.has(track.id as string)
  );

  return singleTracks.map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    artist_id: row.artist_id as string,
    file_path: row.file_path as string,
    title: row.title as string | null,
    artist: row.artist as string | null,
    created_at: row.created_at as string,
    like_count: (row.like_count as number | null) ?? undefined,
    play_count: (row.play_count as number | null) ?? undefined,
    nickname: (row.users as { nickname?: string } | null)?.nickname ?? undefined,
    artist_tier: (row.users as { artist_tier?: string } | null)?.artist_tier as import("@/types/tier").ArtistTier ?? 'basic',
  })) as import("@/types/player").DbTrack[];
}

import { createClient } from "./client";
import type { ChartTrack } from "@/data/chart";
import type { PlaylistTrack, DbTrack, HistoryTrack } from "@/types/player";
import type { ArtistTier } from "@/types/tier";
import { pickCoverColor } from "@/utils/coverColor";

/** tracks 테이블에서 play_count 상위 N개를 반환합니다. */
export async function getTopChartTracks(limit = 5): Promise<ChartTrack[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tracks")
    .select("id, title, artist, play_count, file_path, cover_url, users!user_id(artist_tier, nickname)")
    .eq("visibility", "public")
    .or(`publish_at.is.null,publish_at.lte.${new Date().toISOString()}`)
    .order("play_count", { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) return [];

  return data.map((row, i) => ({
    id: row.id as string,
    rank: i + 1,
    title: (row.title as string | null) ?? "제목 없음",
    artist: (row.artist as string | null) ?? "Unknown Artist",
    coverColor: pickCoverColor(row.id as string),
    isFoundingMember: false,
    file_path: (row.file_path as string | null) ?? undefined,
    cover_url: (row.cover_url as string | null) ?? undefined,
    play_count: (row.play_count as number | null) ?? 0,
    artist_tier: (row.users as { artist_tier?: string; nickname?: string } | null)?.artist_tier as ArtistTier ?? 'basic',
    uploader_nickname: (row.users as { artist_tier?: string; nickname?: string } | null)?.nickname,
  }));
}

/** 기간 + 태그 필터 차트 — get_chart_tracks RPC 사용 */
export async function getChartByPeriod(
  period: 'daily' | 'weekly' | 'monthly' = 'weekly',
  tagIds: string[] = [],
  limit = 50
): Promise<ChartTrack[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_chart_tracks', {
    p_period: period,
    p_tag_ids: tagIds,
    p_limit: limit,
  });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row, i) => ({
    id: row.id as string,
    rank: i + 1,
    title: (row.title as string | null) ?? '제목 없음',
    artist: (row.artist as string | null) ?? 'Unknown Artist',
    coverColor: pickCoverColor(row.id as string),
    isFoundingMember: false,
    file_path: (row.file_path as string | null) ?? undefined,
    play_count: Number(row.play_count ?? 0),
    like_count: Number(row.like_count ?? 0),
    period_plays: Number(row.period_plays ?? 0),
    period_likes: Number(row.period_likes ?? 0),
    score: Number(row.score ?? 0),
  }));
}

/** 최신 등록 트랙 목록 (created_at DESC) */
export async function getLatestTracks(limit = 20): Promise<ChartTrack[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tracks')
    .select('id, title, artist, play_count, like_count, file_path, cover_url, created_at, users!user_id(artist_tier, nickname)')
    .eq('visibility', 'public')
    .or(`publish_at.is.null,publish_at.lte.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row, i) => ({
    id: row.id as string,
    rank: i + 1,
    title: (row.title as string | null) ?? '제목 없음',
    artist: (row.artist as string | null) ?? 'Unknown Artist',
    coverColor: pickCoverColor(row.id as string),
    isFoundingMember: false,
    file_path: (row.file_path as string | null) ?? undefined,
    cover_url: (row.cover_url as string | null) ?? undefined,
    play_count: (row.play_count as number | null) ?? 0,
    like_count: (row.like_count as number | null) ?? 0,
    artist_tier: (row.users as { artist_tier?: string; nickname?: string } | null)?.artist_tier as ArtistTier ?? 'basic',
    uploader_nickname: (row.users as { artist_tier?: string; nickname?: string } | null)?.nickname,
  }));
}

/** 재생 시 play_count를 1 증가시킵니다. 로그인 불필요 (SECURITY DEFINER). */
export async function incrementPlayCount(trackId: string): Promise<void> {
  if (!trackId || trackId.startsWith("upload-")) return; // 로컬 blob 트랙 제외
  const supabase = createClient();
  const { error } = await supabase.rpc("increment_play_count", { track_id: trackId });
  if (error) {
    console.error("[incrementPlayCount]", error);
  }
}

/** 로그인한 사용자가 좋아요한 track_id Set을 반환합니다. 비로그인 시 빈 Set. */
export async function getUserLikedTrackIds(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("track_likes")
    .select("track_id")
    .eq("user_id", userId);
  if (error || !data) return new Set();
  return new Set(data.map((row) => row.track_id as string));
}

/** 좋아요 토글. 반환값으로 최신 상태 확인. 로컬 blob 트랙은 null 반환. */
export async function toggleTrackLike(
  trackId: string
): Promise<{ liked: boolean; like_count: number } | null> {
  if (trackId.startsWith("upload-")) return null;
  const supabase = createClient();
  const { data, error } = await supabase.rpc("toggle_track_like", { p_track_id: trackId });
  if (error || data == null) return null;
  return data as { liked: boolean; like_count: number };
}

/** 공개 트랙(모든 사용자의 업로드)을 최신순으로 반환합니다. */
export async function loadPublicTracks(limit = 50): Promise<PlaylistTrack[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tracks")
    .select("id, file_path, title, artist, like_count, cover_url, users!user_id(artist_tier, nickname)")
    .eq("visibility", "public")
    .or(`publish_at.is.null,publish_at.lte.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!data) return [];

  return data.map((row) => ({
    id: row.id as string,
    rank: 0,
    title: (row.title as string | null) ?? "제목 없음",
    artist: (row.artist as string | null) ?? "Unknown Artist",
    coverColor: pickCoverColor(row.id as string),
    isFoundingMember: false,
    file_path: (row.file_path as string | null) ?? undefined,
    cover_url: (row.cover_url as string | null) ?? undefined,
    like_count: (row.like_count as number | null) ?? 0,
    artist_tier: (row.users as { artist_tier?: string; nickname?: string } | null)?.artist_tier as ArtistTier ?? 'basic',
    uploader_nickname: (row.users as { artist_tier?: string; nickname?: string } | null)?.nickname,
  }));
}

/** 트랙의 제목과 아티스트를 업데이트합니다. client-side only. */
export async function updateTrackMeta(
  id: string,
  title: string,
  artist: string
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { error } = await supabase
    .from("tracks")
    .update({ title, artist })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (error.code === 'PGRST301') {
      throw new Error("권한이 없습니다. RLS 정책을 확인하세요.");
    }
    throw new Error(`곡 정보 업데이트 실패: ${error.message}`);
  }
}

/** 특정 아티스트의 곡 목록을 반환합니다. */
export async function getTracksByArtist(artistName: string): Promise<DbTrack[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tracks")
    .select("id, user_id, artist_id, file_path, title, artist, created_at, like_count, play_count, cover_url, users!user_id(artist_tier)")
    .ilike("artist", artistName)
    .eq("visibility", "public")
    .or(`publish_at.is.null,publish_at.lte.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    artist_id: row.artist_id as string,
    file_path: row.file_path as string,
    title: row.title as string | null,
    artist: row.artist as string | null,
    created_at: row.created_at as string,
    like_count: (row.like_count as number | null) ?? undefined,
    play_count: (row.play_count as number | null) ?? undefined,
    cover_url: (row.cover_url as string | null) ?? undefined,
    artist_tier: (row.users as { artist_tier?: string } | null)?.artist_tier as ArtistTier ?? 'basic',
  })) as DbTrack[];
}

/** user_id 기반으로 해당 사용자의 트랙 목록 반환 */
export async function getTracksByUserId(userId: string, includePrivate = true): Promise<DbTrack[]> {
  const supabase = createClient();
  let query = supabase
    .from("tracks")
    .select("id, user_id, artist_id, file_path, title, artist, created_at, like_count, play_count, cover_url, users!user_id(artist_tier)")
    .eq("user_id", userId)
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (!includePrivate) {
    query = query.neq("visibility", "private")
      .or(`publish_at.is.null,publish_at.lte.${new Date().toISOString()}`);
  }
  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    artist_id: row.artist_id as string,
    file_path: row.file_path as string,
    title: row.title as string | null,
    artist: row.artist as string | null,
    created_at: row.created_at as string,
    like_count: (row.like_count as number | null) ?? undefined,
    play_count: (row.play_count as number | null) ?? undefined,
    cover_url: (row.cover_url as string | null) ?? undefined,
    artist_tier: (row.users as { artist_tier?: string } | null)?.artist_tier as ArtistTier ?? 'basic',
  })) as DbTrack[];
}

/** 로그인 사용자의 개인 재생목록을 최신 추가순으로 반환합니다. */
export async function getUserPlaylistTracks(): Promise<PlaylistTrack[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_playlist")
    .select("added_at, tracks(id, file_path, title, artist, like_count, play_count)")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (error || !data) return [];

  return data
    .map((row) => {
      const t = Array.isArray(row.tracks) ? row.tracks[0] : row.tracks;
      const track = t as Record<string, unknown> | undefined;
      if (!track) return undefined;
      return {
        id: track.id as string,
        rank: 0,
        title: (track.title as string | null) ?? "제목 없음",
        artist: (track.artist as string | null) ?? "Unknown Artist",
        coverColor: pickCoverColor(track.id as string),
        isFoundingMember: false,
        file_path: (track.file_path as string | null) ?? undefined,
        like_count: (track.like_count as number | null) ?? 0,
        play_count: (track.play_count as number | null) ?? 0,
      } as PlaylistTrack;
    })
    .filter((t) => t !== undefined) as PlaylistTrack[];
}

/** 로그인 사용자의 재생목록에 트랙을 추가합니다. 이미 있으면 무시. */
export async function addToUserPlaylist(trackId: string): Promise<void> {
  if (!trackId || trackId.startsWith("upload-")) return;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from("user_playlist")
    .upsert(
      { user_id: user.id, track_id: trackId, added_at: new Date().toISOString() },
      { onConflict: "user_id,track_id" }
    );
  if (error) console.error("[addToUserPlaylist]", error);
}

/** 재생 시 play_history에 upsert. 비로그인 시 RPC가 no-op. 로컬 blob 트랙 제외. */
export async function addPlayHistory(trackId: string): Promise<void> {
  if (!trackId || trackId.startsWith("upload-")) return;
  const supabase = createClient();
  const { error } = await supabase.rpc("upsert_play_history", { p_track_id: trackId });
  if (error) {
    console.error("[addPlayHistory]", error);
  }
}

/** 로그인 사용자의 재생 히스토리를 최근순으로 반환. 비로그인 시 빈 배열. */
export async function getPlayHistory(limit = 20): Promise<HistoryTrack[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("play_history")
    .select("played_at, tracks(id, title, artist, file_path, like_count, play_count)")
    .eq("user_id", user.id)
    .order("played_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data
    .map((row) => {
      const t = Array.isArray(row.tracks) ? row.tracks[0] : row.tracks;
      const track = t as Record<string, unknown> | undefined;
      if (!track) return undefined;
      return {
        id: track.id as string,
        title: (track.title as string | null) ?? "제목 없음",
        artist: (track.artist as string | null) ?? "Unknown Artist",
        file_path: (track.file_path as string | null) ?? undefined,
        coverColor: pickCoverColor(track.id as string),
        isFoundingMember: false,
        rank: 0,
        played_at: row.played_at as string,
        like_count: (track.like_count as number | null) ?? 0,
        play_count: (track.play_count as number | null) ?? 0,
      } as HistoryTrack;
    })
    .filter((t) => t !== undefined) as HistoryTrack[];
}

/** 로그인 사용자가 좋아요한 트랙 목록을 최신순으로 반환합니다. 비로그인 시 빈 배열. */
export async function getLikedTracks(): Promise<PlaylistTrack[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("track_likes")
    .select("created_at, tracks(id, title, artist, file_path, like_count, play_count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data
    .filter(row => row.tracks)
    .map(row => {
      const t = row.tracks as any;
      return {
        id: t.id,
        rank: 0,
        title: t.title ?? "제목 없음",
        artist: t.artist ?? "Unknown Artist",
        coverColor: pickCoverColor(t.id),
        isFoundingMember: false,
        file_path: t.file_path,
        like_count: t.like_count,
        play_count: t.play_count,
      } satisfies PlaylistTrack;
    });
}

export type FollowedArtist = {
  user_id: string;
  nickname: string;
  artist_tier: string;
  follower_count: number;
};

/** 로그인 사용자가 팔로우한 아티스트 목록을 최신 팔로우순으로 반환. */
export async function getFollowedArtists(): Promise<FollowedArtist[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("follows")
    .select("following_id, users!following_id(nickname, artist_tier, follower_count)")
    .eq("follower_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data
    .map((row) => {
      const u = row.users as { nickname?: string; artist_tier?: string; follower_count?: number } | null;
      if (!u?.nickname) return undefined;
      return {
        user_id: row.following_id as string,
        nickname: u.nickname,
        artist_tier: u.artist_tier ?? "basic",
        follower_count: u.follower_count ?? 0,
      };
    })
    .filter((a): a is FollowedArtist => a !== undefined);
}

export type TopArtist = { artist: string; count: number };
export type DailyPlay = { date: string; count: number };

export type TasteAnalysis = {
  topArtists: TopArtist[];
  last7Days: DailyPlay[];
  totalPlayed: number;
};

export async function getTasteAnalysis(): Promise<TasteAnalysis | null> {
  const history = await getPlayHistory(50);
  if (!history.length) return null;

  const artistMap = new Map<string, number>();
  for (const h of history) {
    artistMap.set(h.artist, (artistMap.get(h.artist) ?? 0) + 1);
  }
  const topArtists = [...artistMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([artist, count]) => ({ artist, count }));

  const today = new Date();
  const last7Days: DailyPlay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    const count = history.filter(h => {
      const pd = new Date(h.played_at);
      return pd.getFullYear() === d.getFullYear() &&
             pd.getMonth() === d.getMonth() &&
             pd.getDate() === d.getDate();
    }).length;
    last7Days.push({ date: key, count });
  }

  return { topArtists, last7Days, totalPlayed: history.length };
}

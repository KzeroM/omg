import type { ChartTrack } from "@/data/chart";
import type { ArtistTier } from "./tier";

/** 차트/재생목록에 표시되는 트랙. blobUrl(로컬) 또는 file_path(Supabase)로 재생 */
export type PlaylistTrack = ChartTrack & {
  blobUrl?: string;
  /** Supabase storage path (Private 버킷, 재생 시 signed URL 사용) */
  file_path?: string;
  artist_tier?: ArtistTier;
};

/** DB tracks 테이블 행 (내 보관함 등) */
export interface DbTrack {
  id: string;
  user_id: string;
  artist_id: string; // 업로드한 유저의 ID
  file_path: string;
  title: string | null;
  artist: string | null;
  created_at: string;
  play_count?: number;
  like_count?: number;
  nickname?: string; // public.users.nickname (JOIN 시 존재)
  artist_tier?: ArtistTier;
  cover_url?: string | null;
}

/** 재생 히스토리 항목 (play_history 테이블 join 결과) */
export interface HistoryTrack {
  id: string;
  title: string;
  artist: string;
  file_path?: string;
  coverColor: string;
  isFoundingMember: boolean;
  rank: number;
  played_at: string;
  like_count?: number;
  play_count?: number;
}

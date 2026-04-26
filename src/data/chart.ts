import type { ArtistTier } from "@/types/tier";

export interface ChartTrack {
  id: string;
  rank: number;
  title: string;
  artist: string;
  coverColor: string; // CSS gradient or single color for placeholder
  isFoundingMember: boolean;
  like_count?: number;
  file_path?: string;
  play_count?: number;
  artist_tier?: ArtistTier;
  uploader_nickname?: string; // public.users.nickname (업로더의 플랫폼 닉네임)
  period_plays?: number;
  period_likes?: number;
  score?: number;
  cover_url?: string; // Supabase Storage 커버 이미지 URL
}

export interface PopularArtist {
  id: string;
  name: string;
  tagline: string;
  color: string;
}

export const TOP_CHART: ChartTrack[] = [
  { id: "1", rank: 1, title: "Midnight Code", artist: "Vibe Master", coverColor: "from-[#A855F7] to-[#6366f1]", isFoundingMember: true },
  { id: "2", rank: 2, title: "Algorithm Dreams", artist: "Code King", coverColor: "from-[#ec4899] to-[#A855F7]", isFoundingMember: true },
  { id: "3", rank: 3, title: "Neon Pulse", artist: "Synth Wave", coverColor: "from-[#06b6d4] to-[#A855F7]", isFoundingMember: false },
  { id: "4", rank: 4, title: "Binary Love", artist: "Data Drift", coverColor: "from-[#f59e0b] to-[#ef4444]", isFoundingMember: true },
  { id: "5", rank: 5, title: "Cloud Nine", artist: "Pixel Poet", coverColor: "from-[#10b981] to-[#A855F7]", isFoundingMember: false },
];

export const POPULAR_ARTISTS: PopularArtist[] = [
  { id: "vm", name: "Vibe Master", tagline: "Electronic & Code", color: "#A855F7" },
  { id: "ck", name: "Code King", tagline: "Dev Anthems", color: "#ec4899" },
  { id: "sw", name: "Synth Wave", tagline: "Retro Synth", color: "#06b6d4" },
  { id: "dd", name: "Data Drift", tagline: "Data & Beats", color: "#f59e0b" },
  { id: "pp", name: "Pixel Poet", tagline: "Indie Digital", color: "#10b981" },
];

import type { PlaylistTrack } from "@/types/player";

const HISTORY_KEY = "omg_play_history";
const MAX_HISTORY = 10;

export interface LocalHistoryTrack {
  id: string;
  title: string;
  artist: string;
  coverColor: string;
  played_at: string;
}

export function saveLocalHistory(track: LocalHistoryTrack): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const existing: LocalHistoryTrack[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((t) => t.id !== track.id);
    const updated = [track, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // localStorage 접근 불가 환경에서 조용히 실패
  }
}

export function loadLocalHistory(): LocalHistoryTrack[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ── 게스트 재생목록 (비로그인 시 localStorage에 저장) ──────────────────────

const PLAYLIST_KEY = "omg_guest_playlist";

export function loadGuestPlaylist(): PlaylistTrack[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PLAYLIST_KEY);
    return raw ? (JSON.parse(raw) as PlaylistTrack[]) : [];
  } catch {
    return [];
  }
}

export function saveGuestPlaylist(tracks: PlaylistTrack[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLAYLIST_KEY, JSON.stringify(tracks));
  } catch {}
}

export function addToGuestPlaylist(track: PlaylistTrack): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadGuestPlaylist();
    if (existing.some((t) => t.id === track.id)) return;
    saveGuestPlaylist([track, ...existing]);
  } catch {}
}

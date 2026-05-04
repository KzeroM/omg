"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePlayer } from "@/context/PlayerContext";
import type { PlaylistTrack, HistoryTrack } from "@/types/player";
import {
  getLikedTracks,
  getPlayHistory,
  getFollowedArtists,
  type FollowedArtist,
} from "@/utils/supabase/tracks";
import { getAlbumsByUserId, createAlbum } from "@/utils/supabase/albums";
import type { DbAlbum } from "@/types/album";

export interface UserInfo {
  nickname: string | null;
  bio: string | null;
  artist_tier: string | null;
}

export interface MyTrack {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  play_count: number;
  like_count: number;
  cover_url: string | null;
  created_at: string;
}

export interface UseMyPageDataReturn {
  userInfo: UserInfo;
  likedTracks: PlaylistTrack[];
  recentHistory: HistoryTrack[];
  followedArtists: FollowedArtist[];
  recommendations: PlaylistTrack[];
  playlists: { id: string; title: string; is_public: boolean }[];
  myTracks: MyTrack[];
  setMyTracks: React.Dispatch<React.SetStateAction<MyTrack[]>>;
  myAlbums: DbAlbum[];
  setMyAlbums: React.Dispatch<React.SetStateAction<DbAlbum[]>>;
  showCreateAlbum: boolean;
  setShowCreateAlbum: React.Dispatch<React.SetStateAction<boolean>>;
  newAlbumTitle: string;
  setNewAlbumTitle: React.Dispatch<React.SetStateAction<string>>;
  creatingAlbum: boolean;
  loading: boolean;
  isLoggedIn: boolean | null;
  loadData: () => Promise<void>;
  handlePlay: (track: PlaylistTrack | HistoryTrack) => void;
  handleCreateAlbum: (setToast: (msg: string) => void) => Promise<void>;
  currentTrack: ReturnType<typeof usePlayer>["currentTrack"];
  isPlaying: boolean;
}

export function useMyPageData(): UseMyPageDataReturn {
  const [userInfo, setUserInfo] = useState<UserInfo>({ nickname: null, bio: null, artist_tier: null });
  const [likedTracks, setLikedTracks] = useState<PlaylistTrack[]>([]);
  const [recentHistory, setRecentHistory] = useState<HistoryTrack[]>([]);
  const [followedArtists, setFollowedArtists] = useState<FollowedArtist[]>([]);
  const [recommendations, setRecommendations] = useState<PlaylistTrack[]>([]);
  const [playlists, setPlaylists] = useState<{ id: string; title: string; is_public: boolean }[]>([]);
  const [myTracks, setMyTracks] = useState<MyTrack[]>([]);
  const [myAlbums, setMyAlbums] = useState<DbAlbum[]>([]);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const { currentTrack, isPlaying, addTrack, playTrack, newReleases } = usePlayer();

  const loadData = useCallback(async () => {
    const withTimeout = <T,>(p: PromiseLike<T>, fallback: T, ms = 8_000): Promise<T> =>
      Promise.race([Promise.resolve(p), new Promise<T>((res) => setTimeout(() => res(fallback), ms))]);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) {
        setIsLoggedIn(false);
        return;
      }
      setIsLoggedIn(true);

      type ProfileRow = { nickname: string | null; bio: string | null; artist_tier: string | null } | null;
      type TracksRow = { id: string; user_id: string; title: string | null; artist: string | null; play_count: number | null; like_count: number | null; cover_url: string | null; created_at: string }[];
      const [profileResult, liked, history, followed, recsRes, playlistsRes, tracksResult, albums] =
        await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          withTimeout(supabase.from("users").select("nickname, bio, artist_tier").eq("user_id", user.id).single(), { data: null, error: null } as any),
          withTimeout(getLikedTracks(), [] as PlaylistTrack[]).catch(() => [] as PlaylistTrack[]),
          withTimeout(getPlayHistory(5), [] as HistoryTrack[]).catch(() => [] as HistoryTrack[]),
          withTimeout(getFollowedArtists(), [] as FollowedArtist[]).catch(() => [] as FollowedArtist[]),
          withTimeout(
            fetch("/api/user/recommendations").then((r) => r.ok ? r.json() as Promise<{ tracks?: PlaylistTrack[] }> : { tracks: [] as PlaylistTrack[] }).catch(() => ({ tracks: [] as PlaylistTrack[] })),
            { tracks: [] as PlaylistTrack[] }
          ),
          withTimeout(
            fetch("/api/playlists").then((r) => r.ok ? r.json() as Promise<{ playlists?: { id: string; title: string; is_public: boolean }[] }> : { playlists: [] as { id: string; title: string; is_public: boolean }[] }).catch(() => ({ playlists: [] as { id: string; title: string; is_public: boolean }[] })),
            { playlists: [] as { id: string; title: string; is_public: boolean }[] }
          ),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          withTimeout(supabase.from("tracks").select("id, user_id, title, artist, play_count, like_count, cover_url, created_at").eq("user_id", user.id).order("created_at", { ascending: false }), { data: [], error: null } as any),
          withTimeout(getAlbumsByUserId(user.id), [] as DbAlbum[]).catch(() => [] as DbAlbum[]),
        ]);
      const profile = profileResult.data;
      const tracks = tracksResult.data;

      if (profile) {
        setUserInfo({
          nickname: profile.nickname as string | null,
          bio: profile.bio as string | null,
          artist_tier: profile.artist_tier as string | null,
        });
      }
      setLikedTracks(liked);
      setRecentHistory(history);
      setFollowedArtists(followed);
      setRecommendations(recsRes.tracks ?? []);
      setPlaylists(playlistsRes.playlists ?? []);
      setMyTracks((tracks ?? []) as MyTrack[]);
      setMyAlbums(albums);
    } catch (err) {
      console.error("[useMyPageData] loadData 실패:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void loadData();
      }
    });
    return () => subscription.unsubscribe();
  }, [loadData]);

  const handlePlay = (track: PlaylistTrack | HistoryTrack) => {
    const pt = track as PlaylistTrack;
    const existingIndex = newReleases.findIndex((t) => t.id === pt.id);
    if (existingIndex !== -1) playTrack(existingIndex);
    else addTrack(pt);
  };

  const handleCreateAlbum = async (setToast: (msg: string) => void) => {
    if (!newAlbumTitle.trim()) return;
    setCreatingAlbum(true);
    try {
      const album = await createAlbum({ title: newAlbumTitle.trim() });
      setMyAlbums((prev) => [album, ...prev]);
      setNewAlbumTitle("");
      setShowCreateAlbum(false);
    } catch {
      setToast("앨범 생성에 실패했습니다.");
    } finally {
      setCreatingAlbum(false);
    }
  };

  return {
    userInfo,
    likedTracks,
    recentHistory,
    followedArtists,
    recommendations,
    playlists,
    myTracks,
    setMyTracks,
    myAlbums,
    setMyAlbums,
    showCreateAlbum,
    setShowCreateAlbum,
    newAlbumTitle,
    setNewAlbumTitle,
    creatingAlbum,
    loading,
    isLoggedIn,
    loadData,
    handlePlay,
    handleCreateAlbum,
    currentTrack,
    isPlaying,
  };
}

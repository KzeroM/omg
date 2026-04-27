"use client";

import { useState, useEffect, useCallback } from "react";

interface Playlist {
  id: string;
  title: string;
}

export interface UsePlaylistActionsReturn {
  playlists: Playlist[];
  loading: boolean;
  newTitle: string;
  setNewTitle: (v: string) => void;
  creating: boolean;
  added: Record<string, boolean>;
  showCreate: boolean;
  setShowCreate: (v: boolean) => void;
  isSuccess: boolean;
  error: string | null;
  fetchPlaylists: () => Promise<void>;
  handleAdd: (playlistId: string) => Promise<void>;
  handleCreate: (e: React.FormEvent) => Promise<void>;
}

/**
 * Manages playlist list fetching, track-add, and playlist-create actions.
 * Accepts trackId as the target track to add.
 */
export function usePlaylistActions(trackId: string): UsePlaylistActionsReturn {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuccess && !error) return;
    let timerId: NodeJS.Timeout | undefined;
    if (isSuccess) {
      timerId = setTimeout(() => setIsSuccess(false), 2000);
    } else if (error) {
      timerId = setTimeout(() => setError(null), 3000);
    }
    return () => { if (timerId) clearTimeout(timerId); };
  }, [isSuccess, error]);

  const fetchPlaylists = useCallback(async () => {
    setAdded({});
    setLoading(true);
    const res = await fetch("/api/playlists");
    const data = await res.json() as { playlists: Playlist[] };
    setPlaylists(data.playlists ?? []);
    setLoading(false);
  }, []);

  const handleAdd = useCallback(async (playlistId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_id: trackId }),
      });
      if (res.ok || res.status === 409) {
        setAdded((prev) => ({ ...prev, [playlistId]: true }));
        setIsSuccess(true);
        setError(null);
      } else {
        const errorData = await res.json() as { error?: string };
        setError(errorData.error || "플레이리스트에 추가할 수 없습니다.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  }, [trackId]);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json() as { playlist?: Playlist };
      if (data.playlist) {
        setPlaylists((prev) => [data.playlist!, ...prev]);
        setNewTitle("");
        setShowCreate(false);
        void handleAdd(data.playlist.id);
      } else {
        setError("플레이리스트를 생성할 수 없습니다.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  }, [newTitle, handleAdd]);

  return {
    playlists, loading, newTitle, setNewTitle,
    creating, added, showCreate, setShowCreate,
    isSuccess, error,
    fetchPlaylists, handleAdd, handleCreate,
  };
}

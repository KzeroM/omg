"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { getSignedPlaybackUrl } from "@/utils/supabase/storage";
import { incrementPlayCount, getUserLikedTrackIds, toggleTrackLike, loadPublicTracks, updateTrackMeta, addPlayHistory, getUserPlaylistTracks, addToUserPlaylist } from "@/utils/supabase/tracks";
import { loadGuestPlaylist, addToGuestPlaylist } from "@/utils/localStorage";
import { useToast } from "@/context/ToastContext";
import type { PlaylistTrack } from "@/types/player";

/** seekbar 전용 — 초당 수십 번 변경. PlayerBar만 구��해야 함. */
type PlayerTimeContextValue = {
  currentTime: number;
  duration: number;
};

const PlayerTimeContext = createContext<PlayerTimeContextValue>({ currentTime: 0, duration: 0 });

type PlayerContextValue = {
  /** 전체 공개 트랙 — 탐색/표시용 (New Releases 섹션) */
  publicTracks: PlaylistTrack[];
  /** 사용자 개인 재생목록 — 플레이어 큐 (로그인: DB, 게스트: localStorage) */
  newReleases: PlaylistTrack[];
  currentIndex: number;
  /** 현재 재생 중인 곡 (newReleases[currentIndex]) */
  currentTrack: PlaylistTrack | null;
  /** 다음에 재생될 곡 */
  upNextTrack: PlaylistTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  playTrack: (index: number) => void;
  togglePlay: () => void;
  seek: (fraction: number) => void;
  setVolume: (value: number) => void;
  prev: () => void;
  next: () => void;
  /** 로컬 파일을 메모리로 올려 재생 (비로그인 시) */
  addUploadedTrack: (file: File, artist?: string) => void;
  /** Supabase 업로드된 트랙을 목록에 추가 (재생 시 signed URL 사용) */
  addTrack: (track: PlaylistTrack) => void;
  /** Supabase tracks 테이블에서 본인 트랙을 다시 로드 */
  loadTracksFromDB: () => Promise<void>;
  /** 현재 사용자가 좋아요한 track_id Set (로컬 캐시) */
  likedTrackIds: Set<string>;
  /** track_id → like_count 로컬 캐시 (낙관적 업데이트 반영) */
  likeCounts: Record<string, number>;
  /** 좋아요 토글. 낙관적 업데이트 후 RPC 보정. */
  toggleLike: (trackId: string) => Promise<void>;
  /** 낙관적 업데이트 중인 track_id (RPC 응답 대기 구간) */
  pendingLikeId: string | null;
  /** 단일 곡을 직접 재생 (PlaylistTrack) */
  playSingleTrack: (track: PlaylistTrack) => Promise<void>;
  /** 셔플 활성화 여부 */
  shuffleEnabled: boolean;
  /** 반복 모드 ('none' | 'all' | 'one') */
  repeatMode: 'none' | 'all' | 'one';
  /** 셔플 토글 */
  toggleShuffle: () => void;
  /** 반복 모드 설정 */
  setRepeatMode: (mode: 'none' | 'all' | 'one') => void;
  /** 트랙의 제목과 아티스트를 업데이트합니다. */
  updateTrackMeta: (id: string, title: string, artist: string) => Promise<void>;
  /** 큐에서 특정 인덱스의 트랙을 제거합니다. */
  removeFromQueue: (index: number) => void;
  /** 큐 전체를 비우고 재생을 정지합니다. */
  clearQueue: () => void;
  /** 큐 내 트랙 순서를 변경합니다. */
  moveInQueue: (from: number, to: number) => void;
  /** 재생 큐 패널 열림 여부 */
  queueOpen: boolean;
  setQueueOpen: (open: boolean) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

function formatIdFromFile(file: File): string {
  return `upload-${file.name}-${Date.now()}`;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [publicTracks, setPublicTracks] = useState<PlaylistTrack[]>([]);
  const [newReleases, setNewReleases] = useState<PlaylistTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [pendingLikeId, setPendingLikeId] = useState<string | null>(null);
  const [overrideTrack, setOverrideTrack] = useState<PlaylistTrack | null>(null);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatModeState] = useState<'none' | 'all' | 'one'>('none');
  const [queueOpen, setQueueOpen] = useState(false);
  const { showToast } = useToast();
  const isLoggedInRef = useRef(false);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPreviewTimer = useCallback(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, []);

  const startPreviewTimerIfGuest = useCallback(
    (trackId: string) => {
      clearPreviewTimer();
      if (isLoggedInRef.current) return;
      if (trackId.startsWith("upload-")) return;
      previewTimerRef.current = setTimeout(() => {
        audioRef.current?.pause();
        showToast("1분 미리듣기가 종료되었습니다. 전체 감상은 로그인 후 이용하세요.");
      }, 60_000);
    },
    [clearPreviewTimer, showToast]
  );

  const currentTrack = overrideTrack ?? newReleases[currentIndex] ?? null;
  const canPlay = overrideTrack ? true : (currentTrack?.blobUrl != null || currentTrack?.file_path != null);

  const upNextTrack: PlaylistTrack | null = useMemo(() => {
    if (overrideTrack) return null;
    if (newReleases.length === 0) return null;
    if (repeatMode === 'one') return currentTrack;
    if (shuffleEnabled) return null;
    if (currentIndex + 1 < newReleases.length) return newReleases[currentIndex + 1];
    return newReleases[0];
  }, [overrideTrack, newReleases, repeatMode, shuffleEnabled, currentIndex, currentTrack]);

  const loadAndPlay = useCallback(
    async (index: number) => {
      const track = newReleases[index];
      let playUrl: string | null = track?.blobUrl ?? null;
      if (!playUrl && track?.file_path) {
        setIsLoading(true);
        playUrl = await getSignedPlaybackUrl(track.file_path);
        setIsLoading(false);
      }
      if (!playUrl || !audioRef.current) {
        setCurrentIndex(index);
        setDuration(0);
        setCurrentTime(0);
        setIsPlaying(false);
        if (!playUrl) {
          showToast("재생 URL을 가져올 수 없습니다.");
        }
        return;
      }
      setCurrentIndex(index);
      audioRef.current.src = playUrl;
      audioRef.current.volume = volume;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          void incrementPlayCount(track.id);
          void addPlayHistory(track.id);
          startPreviewTimerIfGuest(track.id);
        })
        .catch((err) => {
          setIsPlaying(false);
          if (err?.name === "NotAllowedError") {
            showToast("브라우저 자동재생 차단");
          } else {
            showToast("재생에 실패했습니다.");
          }
        });
    },
    [newReleases, volume, showToast, startPreviewTimerIfGuest]
  );

  const playSingleTrack = useCallback(
    async (track: PlaylistTrack) => {
      let playUrl: string | null = track.blobUrl ?? null;
      if (!playUrl && track.file_path) {
        setIsLoading(true);
        playUrl = await getSignedPlaybackUrl(track.file_path);
        setIsLoading(false);
      }
      if (!playUrl || !audioRef.current) {
        setOverrideTrack(null);
        setIsPlaying(false);
        if (!playUrl) {
          showToast("재생 URL을 가져올 수 없습니다.");
        }
        return;
      }
      setOverrideTrack(track);
      audioRef.current.src = playUrl;
      audioRef.current.volume = volume;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          void incrementPlayCount(track.id);
          void addPlayHistory(track.id);
          startPreviewTimerIfGuest(track.id);
        })
        .catch((err) => {
          setIsPlaying(false);
          if (err?.name === "NotAllowedError") {
            showToast("브라우저 자동재생 차단");
          } else {
            showToast("재생에 실패했습니다.");
          }
        });
    },
    [volume, showToast, startPreviewTimerIfGuest]
  );

  const playTrack = useCallback(
    (index: number) => {
      setOverrideTrack(null);
      if (index < 0 || index >= newReleases.length) return;
      const track = newReleases[index];
      if (track.blobUrl || track.file_path) {
        void loadAndPlay(index);
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeAttribute("src");
        }
        setCurrentIndex(index);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
      }
    },
    [newReleases, loadAndPlay]
  );

  const togglePlay = useCallback(() => {
    if (!canPlay || !audioRef.current) return;
    const audio = audioRef.current;
    // 새로고침 후 audio.src가 비어 있으면 (readyState === HAVE_NOTHING)
    // Signed URL을 재발급받아 src를 세팅한 뒤 재생한다.
    if (!audio.src || audio.readyState === HTMLMediaElement.HAVE_NOTHING) {
      if (overrideTrack) {
        void playSingleTrack(overrideTrack);
      } else {
        void loadAndPlay(currentIndex);
      }
      return;
    }
    if (audio.paused) {
      audio.play().catch((err) => {
        if (err?.name === "NotAllowedError") {
          showToast("브라우저 자동재생 차단");
        } else {
          showToast("재생에 실패했습니다.");
        }
      });
    } else {
      audio.pause();
    }
  }, [canPlay, overrideTrack, currentIndex, loadAndPlay, playSingleTrack, showToast]);

  const seek = useCallback((fraction: number) => {
    const el = audioRef.current;
    if (!el || !el.duration || !isFinite(el.duration)) return;
    el.currentTime = fraction * el.duration;
    setCurrentTime(el.currentTime);
  }, []);

  const setVolume = useCallback((value: number) => {
    const v = Math.max(0, Math.min(1, value));
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const prev = useCallback(() => {
    setOverrideTrack(null);
    if (newReleases.length === 0) return;
    const nextIndex = currentIndex <= 0 ? newReleases.length - 1 : currentIndex - 1;
    playTrack(nextIndex);
  }, [currentIndex, newReleases.length, playTrack]);

  const next = useCallback(() => {
    setOverrideTrack(null);
    if (newReleases.length === 0) return;
    let nextIndex: number;
    if (shuffleEnabled) {
      nextIndex = Math.floor(Math.random() * newReleases.length);
    } else {
      nextIndex = currentIndex >= newReleases.length - 1 ? 0 : currentIndex + 1;
    }
    playTrack(nextIndex);
  }, [currentIndex, newReleases.length, playTrack, shuffleEnabled]);

  const addUploadedTrack = useCallback((file: File, artist = "업로드 곡") => {
    setOverrideTrack(null);
    const blobUrl = URL.createObjectURL(file);
    const name = file.name.replace(/\.mp3$/i, "") || "제목 없음";
    const newTrack: PlaylistTrack = {
      id: formatIdFromFile(file),
      rank: 0,
      title: name,
      artist,
      coverColor: "from-[#A855F7] to-[#6366f1]",
      isFoundingMember: false,
      blobUrl,
    };
    setNewReleases((prev) => {
      prev.forEach((t) => { if (t.blobUrl) URL.revokeObjectURL(t.blobUrl); });
      return [newTrack, ...prev];
    });
    setCurrentIndex(0);
    setDuration(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.src = blobUrl;
      audioRef.current.volume = volume;
      audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
        console.error("로컬 파일 재생 실패:", err);
        setIsPlaying(false);
      });
    }
  }, [volume]);

  const loadTracksFromDB = useCallback(async () => {
    setOverrideTrack(null);
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      isLoggedInRef.current = !!user;

      // 1. 전체 공개 트랙 (탐색/디스커버리용)
      const allTracks = await loadPublicTracks();
      setPublicTracks(allTracks);

      // 2. 사용자 개인 재생목록 (로그인: DB, 게스트: localStorage)
      const playlist = user
        ? await getUserPlaylistTracks()
        : loadGuestPlaylist();
      setNewReleases(playlist);

      // 3. 좋아요 상태
      const likedIds = user ? await getUserLikedTrackIds(user.id) : new Set<string>();
      const counts: Record<string, number> = {};
      for (const track of allTracks) {
        counts[track.id] = track.like_count ?? 0;
      }
      setLikedTrackIds(likedIds);
      setLikeCounts(counts);
    } catch (error) {
      console.error("트랙 로드 실패:", error);
      showToast("음악 목록을 불러오지 못했습니다.");
    }
  }, [showToast]);

  const addTrack = useCallback(
    (track: PlaylistTrack) => {
      setOverrideTrack(null);

      // 재생목록에 퍼시스턴스 (DB 또는 localStorage)
      if (!track.id.startsWith("upload-")) {
        if (isLoggedInRef.current) {
          void addToUserPlaylist(track.id);
        } else {
          addToGuestPlaylist(track);
        }
      }

      let targetIndex = 0;
      setNewReleases((prev) => {
        const existing = prev.findIndex((t) => t.id === track.id);
        if (existing !== -1) {
          targetIndex = existing;
          return prev;
        }
        targetIndex = 0;
        return [track, ...prev];
      });
      setCurrentIndex(targetIndex);
      setDuration(0);
      setCurrentTime(0);
      const getUrl = (): Promise<string | null> =>
        track.blobUrl
          ? Promise.resolve(track.blobUrl)
          : track.file_path
            ? getSignedPlaybackUrl(track.file_path)
            : Promise.resolve(null);
      getUrl().then((url) => {
        if (!url) {
          // URL 취득 실패 — playlist에서 제거하고 에러 표시
          setNewReleases((prev) => prev.filter((t) => t.id !== track.id));
          showToast("재생 URL을 가져올 수 없습니다.");
          return;
        }
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.volume = volume;
          audioRef.current.play().then(() => {
            setIsPlaying(true);
            startPreviewTimerIfGuest(track.id);
          }).catch((err: Error) => {
            if (err?.name === "NotAllowedError") {
              showToast("브라우저 자동재생 차단");
            } else {
              showToast("재생에 실패했습니다.");
            }
          });
        }
      }).catch((err) => {
        console.error("트랙 URL 가져오기 실패:", err);
        setNewReleases((prev) => prev.filter((t) => t.id !== track.id));
        showToast("재생 URL을 가져올 수 없습니다.");
      });
    },
    [volume, showToast, startPreviewTimerIfGuest]
  );

  const toggleLike = useCallback(
    async (trackId: string) => {
      if (trackId.startsWith("upload-")) return;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 낙관적 업데이트: 즉시 로컬 상태 반전
      const prevLiked = likedTrackIds.has(trackId);
      const prevCount = likeCounts[trackId] ?? 0;

      setLikedTrackIds((prev) => {
        const next = new Set(prev);
        if (prevLiked) next.delete(trackId);
        else next.add(trackId);
        return next;
      });
      setLikeCounts((prev) => ({
        ...prev,
        [trackId]: prevLiked ? Math.max(prevCount - 1, 0) : prevCount + 1,
      }));
      setPendingLikeId(trackId);

      try {
        const result = await toggleTrackLike(trackId);
        if (result) {
          // RPC 결과로 상태 교정
          setLikedTrackIds((prev) => {
            const next = new Set(prev);
            if (result.liked) next.add(trackId);
            else next.delete(trackId);
            return next;
          });
          setLikeCounts((prev) => ({ ...prev, [trackId]: result.like_count }));
        } else {
          // RPC 실패 시 롤백
          setLikedTrackIds((prev) => {
            const next = new Set(prev);
            if (prevLiked) next.add(trackId);
            else next.delete(trackId);
            return next;
          });
          setLikeCounts((prev) => ({ ...prev, [trackId]: prevCount }));
        }
      } catch {
        // 예외 시 롤백
        setLikedTrackIds((prev) => {
          const next = new Set(prev);
          if (prevLiked) next.add(trackId);
          else next.delete(trackId);
          return next;
        });
        setLikeCounts((prev) => ({ ...prev, [trackId]: prevCount }));
      } finally {
        setPendingLikeId(null);
      }
    },
    [likedTrackIds, likeCounts]
  );

  const toggleShuffle = useCallback(() => {
    setShuffleEnabled((prev) => !prev);
  }, []);

  const setRepeatMode = useCallback((mode: 'none' | 'all' | 'one') => {
    setRepeatModeState(mode);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setNewReleases((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setCurrentIndex((prev) => {
      if (index < prev) return prev - 1;
      return prev;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setNewReleases([]);
    setCurrentIndex(0);
    setOverrideTrack(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
    }
    setIsPlaying(false);
  }, []);

  const moveInQueue = useCallback((from: number, to: number) => {
    setNewReleases((prev) => {
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setCurrentIndex((prev) => {
      if (prev === from) return to;
      if (from < prev && to >= prev) return prev - 1;
      if (from > prev && to <= prev) return prev + 1;
      return prev;
    });
  }, []);

  const updateMetaAndSync = useCallback(
    async (id: string, title: string, artist: string) => {
      try {
        await updateTrackMeta(id, title, artist);
        setNewReleases((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, title, artist } : t
          )
        );
        if (overrideTrack?.id === id) {
          setOverrideTrack({ ...overrideTrack, title, artist });
        }
      } catch (err) {
        throw err;
      }
    },
    [overrideTrack]
  );

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  }, []);

  const handleEnded = useCallback(() => {
    if (newReleases.length === 0) return;
    if (repeatMode === 'one') {
      // 오디오 요소 직접 리셋 (재초기화 없이)
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.error("반복 재생 실패:", err);
          setIsPlaying(false);
        });
      }
    } else if (repeatMode === 'all' || repeatMode === 'none') {
      let nextIndex: number;
      if (shuffleEnabled) {
        nextIndex = Math.floor(Math.random() * newReleases.length);
      } else {
        nextIndex = currentIndex >= newReleases.length - 1 ? 0 : currentIndex + 1;
      }
      playTrack(nextIndex);
    }
  }, [currentIndex, newReleases.length, playTrack, shuffleEnabled, repeatMode]);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  useEffect(() => {
    void loadTracksFromDB();
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      isLoggedInRef.current = !!session?.user;
      if (session?.user) clearPreviewTimer();
      void loadTracksFromDB();
    });
    return () => subscription.unsubscribe();
  }, [loadTracksFromDB, clearPreviewTimer]);

  const value: PlayerContextValue = useMemo(() => ({
    publicTracks,
    newReleases,
    currentIndex,
    currentTrack,
    upNextTrack,
    isPlaying,
    isLoading,
    volume,
    playTrack,
    togglePlay,
    seek,
    setVolume,
    prev,
    next,
    addUploadedTrack,
    addTrack,
    loadTracksFromDB,
    likedTrackIds,
    likeCounts,
    toggleLike,
    pendingLikeId,
    playSingleTrack,
    shuffleEnabled,
    repeatMode,
    toggleShuffle,
    setRepeatMode,
    updateTrackMeta: updateMetaAndSync,
    removeFromQueue,
    clearQueue,
    moveInQueue,
    queueOpen,
    setQueueOpen,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    publicTracks, newReleases, currentIndex, currentTrack, upNextTrack,
    isPlaying, isLoading, volume, likedTrackIds, likeCounts, pendingLikeId,
    shuffleEnabled, repeatMode, queueOpen,
    playTrack, togglePlay, seek, setVolume, prev, next,
    addUploadedTrack, addTrack, loadTracksFromDB, toggleLike, playSingleTrack,
    toggleShuffle, setRepeatMode, updateMetaAndSync, removeFromQueue, clearQueue, moveInQueue,
    setQueueOpen,
  ]);

  const timeValue = useMemo(() => ({ currentTime, duration }), [currentTime, duration]);

  return (
    <PlayerTimeContext.Provider value={timeValue}>
      <PlayerContext.Provider value={value}>
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={handlePlay}
          onPause={handlePause}
          className="hidden"
        />
        {children}
      </PlayerContext.Provider>
    </PlayerTimeContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

/** seekbar/시간 표시 전용 훅. PlayerBar에서만 사용할 것. */
export function usePlayerTime() {
  return useContext(PlayerTimeContext);
}

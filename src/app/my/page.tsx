"use client";

import { useState } from "react";
import { Heart, Music2, Settings, LogIn } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { DbTrack } from "@/types/player";
import { Toast } from "@/components/Toast";
import { ProfileHeaderSkeleton, TrackListSkeleton } from "@/components/skeletons/SkeletonRow";
import { EditTrackModal } from "@/components/EditTrackModal";
import { useMyPageData, type MyTrack } from "@/hooks/useMyPageData";
import { ListenerTab } from "@/components/tabs/ListenerTab";
import { ArtistTab } from "@/components/tabs/ArtistTab";
import { formatKoreanNumber } from "@/utils/formatNumber";

type Tab = "listener" | "artist";

export default function MyPage() {
  const [tab, setTab] = useState<Tab>("listener");
  const [toast, setToast] = useState<string | null>(null);
  const [editingTrack, setEditingTrack] = useState<MyTrack | null>(null);

  const {
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
  } = useMyPageData();

  const avatarLetter = userInfo.nickname?.charAt(0).toUpperCase() ?? "?";

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <ProfileHeaderSkeleton />
        <div className="h-12 animate-pulse rounded-xl bg-[var(--color-bg-surface)] ring-1 ring-[var(--color-border)]" />
        <TrackListSkeleton rows={5} />
      </div>
    );
  }

  if (isLoggedIn === false) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-6 rounded-2xl bg-[var(--color-bg-surface)] px-8 py-20 text-center ring-1 ring-[var(--color-border)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-subtle)]">
            <LogIn className="h-8 w-8 text-[var(--color-accent)]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">로그인이 필요해요</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              마이페이지는 로그인 후 이용할 수 있어요.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            로그인하러 가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">

        {/* 프로필 헤더 */}
        <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-purple-900 text-2xl font-bold text-white">
                {avatarLetter}
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">
                  {userInfo.nickname ?? "닉네임 없음"}
                </p>
                {userInfo.bio && (
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)] max-w-md">
                    {userInfo.bio}
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] transition hover:text-[var(--color-accent)] hover:ring-[var(--color-accent)]"
            >
              <Settings className="h-4 w-4" />
              설정
            </Link>
          </div>

          {/* 통계 */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[var(--color-bg-base)] p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-accent)]">{likedTracks.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">좋아요한 곡</p>
            </div>
            <div className="rounded-xl bg-[var(--color-bg-base)] p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-accent)]">{myTracks.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">올린 곡</p>
            </div>
            <div className="rounded-xl bg-[var(--color-bg-base)] p-3 text-center">
              <p className="text-lg font-bold text-[var(--color-accent)]">{formatKoreanNumber(followedArtists.length)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">팔로잉</p>
            </div>
          </div>
        </section>

        {/* 탭 선택 */}
        <div className="flex gap-2 rounded-xl bg-[var(--color-bg-surface)] p-1 ring-1 ring-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setTab("listener")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
              tab === "listener"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Heart className="h-4 w-4" strokeWidth={1.5} />
            리스너
          </button>
          <button
            type="button"
            onClick={() => setTab("artist")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
              tab === "artist"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Music2 className="h-4 w-4" strokeWidth={1.5} />
            아티스트
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        {tab === "listener" && (
          <ListenerTab
            recommendations={recommendations}
            likedTracks={likedTracks}
            recentHistory={recentHistory}
            playlists={playlists}
            followedArtists={followedArtists}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            handlePlay={handlePlay}
          />
        )}

        {tab === "artist" && (
          <ArtistTab
            myTracks={myTracks}
            myAlbums={myAlbums}
            showCreateAlbum={showCreateAlbum}
            setShowCreateAlbum={setShowCreateAlbum}
            newAlbumTitle={newAlbumTitle}
            setNewAlbumTitle={setNewAlbumTitle}
            creatingAlbum={creatingAlbum}
            userNickname={userInfo.nickname}
            currentTrackId={currentTrack?.id}
            loadData={loadData}
            handleCreateAlbum={() => void handleCreateAlbum(setToast)}
            onEditTrack={setEditingTrack}
          />
        )}

      </div>

      {editingTrack && (
        <EditTrackModal
          track={editingTrack as unknown as DbTrack}
          isOpen={true}
          onClose={() => setEditingTrack(null)}
          onSaved={async (newTitle, newArtist) => {
            const supabase = createClient();
            await supabase.from("tracks")
              .update({ title: newTitle, artist: newArtist })
              .eq("id", editingTrack.id);
            setMyTracks((prev) =>
              prev.map((t) => t.id === editingTrack.id ? { ...t, title: newTitle, artist: newArtist } : t)
            );
          }}
        />
      )}
    </>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import { Trash2, Play, Heart, Pencil, ArrowLeft, Instagram, Twitter, Youtube, Music, MessageCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { getTracksByArtist, getTracksByUserId } from "@/utils/supabase/tracks";
import { usePlayer } from "@/context/PlayerContext";
import { fetchArtistProfile } from "@/utils/user";
import { formatKoreanNumber } from "@/utils/formatNumber";
import { FollowButton } from "@/components/FollowButton";
import { TrackListSkeleton } from "@/components/skeletons/SkeletonRow";
import type { DbTrack, PlaylistTrack } from "@/types/player";
import type { ArtistTier } from "@/types/tier";
import type { SocialLinks } from "@/types/user";
import { Toast } from "@/components/Toast";
import { EditTrackModal } from "@/components/EditTrackModal";
import { ShareButton } from "@/components/ShareButton";
import { ReportButton } from "@/components/ReportButton";
import { TrackRow } from "@/components/TrackRow";
import { TierBadge } from "@/components/TierBadge";
import { pickCoverColor } from "@/utils/coverColor";
import { ArtistAnalytics } from "@/components/ArtistAnalytics";
import { ArtistPostFeed } from "@/components/ArtistPostFeed";

const MUSIC_BUCKET = "omg-tracks";

function toPlaylistTrack(t: DbTrack): PlaylistTrack {
  return {
    id: t.id,
    rank: 0,
    title: t.title ?? "제목 없음",
    artist: t.artist ?? "Unknown Artist",
    coverColor: pickCoverColor(t.id),
    isFoundingMember: false,
    file_path: t.file_path,
    artist_tier: t.artist_tier,
  };
}

export default function ArtistPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: encodedName } = use(params);
  const [artistName, setArtistName] = useState<string | null>(null);
  const [artistTier, setArtistTier] = useState<ArtistTier>('basic');
  const [tracks, setTracks] = useState<DbTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingTrack, setEditingTrack] = useState<DbTrack | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [artistUserId, setArtistUserId] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [artistBio, setArtistBio] = useState<string | null>(null);
  const [artistSocialLinks, setArtistSocialLinks] = useState<SocialLinks | null>(null);
  const { currentTrack, addTrack, playTrack, newReleases, updateTrackMeta } = usePlayer();

  const fetchData = useCallback(async (decoded: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1차: nickname 기반 조회
    const { data: userRow } = await supabase
      .from("users")
      .select("user_id, nickname, follower_count")
      .ilike("nickname", decoded)
      .maybeSingle();

    let tracksResult: DbTrack[] = [];
    let displayName = decoded;

    if (userRow) {
      // nickname 일치 → user_id로 tracks 조회 (타인 방문 시 private 제외)
      const isOwner = user?.id === userRow.user_id;
      tracksResult = await getTracksByUserId(userRow.user_id, isOwner);
      displayName = userRow.nickname;
      setArtistUserId(userRow.user_id);
      setFollowerCount(userRow.follower_count ?? 0);

      // 프로필 정보 조회
      const profileData = await fetchArtistProfile(supabase, userRow.user_id);
      if (profileData) {
        setArtistBio(profileData.bio ?? null);
        setArtistSocialLinks(profileData.social_links ?? null);
      }

      // 현재 사용자가 팔로우 중인지 확인
      if (user && user.id !== userRow.user_id) {
        const { data: followData } = await supabase
          .from("follows")
          .select("1", { count: "exact" })
          .eq("follower_id", user.id)
          .eq("following_id", userRow.user_id)
          .maybeSingle();
        setIsFollowing(!!followData);
      }
    } else {
      // 2차 폴백: artist 텍스트 ilike
      tracksResult = await getTracksByArtist(decoded);
      displayName = decodeURIComponent(decoded);
    }

    if (tracksResult.length > 0) {
      setArtistTier((tracksResult[0].artist_tier as ArtistTier) ?? 'basic');
    }

    setArtistName(displayName);
    setTracks(tracksResult);
    setCurrentUserId(user?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    try {
      const decoded = decodeURIComponent(encodedName);
      void fetchData(decoded);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [encodedName, fetchData]);

  const handlePlay = (track: DbTrack) => {
    const pt = toPlaylistTrack(track);
    const existingIndex = newReleases.findIndex((t) => t.id === track.id);
    if (existingIndex !== -1) {
      playTrack(existingIndex);
    } else {
      addTrack(pt);
    }
  };

  const handleDelete = async (track: DbTrack) => {
    if (!window.confirm(`"${track.title ?? "이 곡"}"을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    setDeletingId(track.id);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || track.user_id !== user.id) {
        setToast("권한이 없습니다.");
        return;
      }
      await supabase.storage.from(MUSIC_BUCKET).remove([track.file_path]);
      const { error } = await supabase.from("tracks").delete().eq("id", track.id);
      if (error) throw error;
      setTracks((prev) => prev.filter((t) => t.id !== track.id));
    } catch (e) {
      console.error(e);
      setToast("삭제에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSaved = async (title: string, artist: string) => {
    if (!editingTrack) return;
    try {
      await updateTrackMeta(editingTrack.id, title, artist);
      setTracks((prev) =>
        prev.map((t) =>
          t.id === editingTrack.id ? { ...t, title, artist } : t
        )
      );
      setToast("곡 정보가 업데이트되었습니다.");
    } catch (error) {
      console.error(error);
      setToast("곡 정보 업데이트에 실패했습니다.");
    }
  };


  return (
    <>
      {editingTrack && (
        <EditTrackModal
          track={editingTrack}
          isOpen={true}
          onClose={() => setEditingTrack(null)}
          onSaved={handleEditSaved}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        {/* Artist Banner */}
        <section className={`relative w-full overflow-hidden rounded-none lg:rounded-2xl bg-gradient-to-br ${pickCoverColor(artistUserId || artistName || 'fallback')} h-64 sm:h-80 lg:h-96 ring-1 ring-[var(--color-border)]`}>
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />

          {/* Content wrapper */}
          <div className="relative h-full px-6 lg:px-8 py-6 lg:py-8 flex flex-col justify-between">
            {/* Top: Back button */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-accent)]"
                aria-label="뒤로가기"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </div>

            {/* Bottom: Title, bio, stats, and follow button */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              {/* Left: Title, tier badge, bio, stats */}
              <div className="flex-1">
                {/* Artist name + tier badge */}
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                    {artistName ?? "로딩 중..."}
                  </h1>
                  <TierBadge tier={artistTier} size="md" />
                </div>

                {/* Bio */}
                {artistBio && (
                  <p className="text-sm sm:text-base text-[var(--color-text-secondary)] line-clamp-2 max-w-2xl mb-4">
                    {artistBio}
                  </p>
                )}

                {/* Stats pills */}
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {artistUserId && (
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 ring-1 ring-white/20">
                      <span className="text-xs sm:text-sm text-[var(--color-text-secondary)]">팔로워</span>
                      <span className="font-bold text-white text-sm sm:text-base">
                        {formatKoreanNumber(followerCount)}명
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 ring-1 ring-white/20">
                    <span className="text-xs sm:text-sm text-[var(--color-text-secondary)]">트랙</span>
                    <span className="font-bold text-white text-sm sm:text-base">
                      {tracks.length}곡
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Social links + Follow button */}
              <div className="flex flex-col items-start lg:items-end gap-3">
                {/* Social links */}
                {artistSocialLinks && (
                  <div className="flex gap-2">
                    {artistSocialLinks.instagram && (
                      <a
                        href={artistSocialLinks.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="transition hover:text-[var(--color-accent)]"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-5 w-5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition" />
                      </a>
                    )}
                    {artistSocialLinks.twitter && (
                      <a
                        href={artistSocialLinks.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="transition hover:text-[var(--color-accent)]"
                        aria-label="Twitter"
                      >
                        <Twitter className="h-5 w-5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition" />
                      </a>
                    )}
                    {artistSocialLinks.youtube && (
                      <a
                        href={artistSocialLinks.youtube}
                        target="_blank"
                        rel="noreferrer"
                        className="transition hover:text-[var(--color-accent)]"
                        aria-label="YouTube"
                      >
                        <Youtube className="h-5 w-5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition" />
                      </a>
                    )}
                    {artistSocialLinks.soundcloud && (
                      <a
                        href={artistSocialLinks.soundcloud}
                        target="_blank"
                        rel="noreferrer"
                        className="transition hover:text-[var(--color-accent)]"
                        aria-label="SoundCloud"
                      >
                        <Music className="h-5 w-5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition" />
                      </a>
                    )}
                  </div>
                )}

                {/* Follow button */}
                {artistUserId && currentUserId !== artistUserId && (
                  <FollowButton
                    artistId={artistUserId}
                    initialFollowing={isFollowing}
                    initialFollowerCount={followerCount}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <TrackListSkeleton rows={5} />
        ) : tracks.length === 0 ? (
          <div className="rounded-2xl bg-[var(--color-bg-surface)] p-8 text-center ring-1 ring-[var(--color-border)]">
            <p className="text-[var(--color-text-muted)]">이 아티스트의 곡이 없습니다.</p>
            <Link href="/" className="mt-3 inline-block text-sm text-[var(--color-accent)] hover:underline">
              홈으로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl bg-[var(--color-bg-surface)] p-5 ring-1 ring-[var(--color-border)] flex flex-col gap-1">
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">트랙</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{tracks.length}</p>
                <p className="text-xs text-[var(--color-text-muted)]">곡</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-bg-surface)] p-5 ring-1 ring-[var(--color-border)] flex flex-col gap-1">
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">총 재생</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{tracks.reduce((s, t) => s + (t.play_count ?? 0), 0).toLocaleString()}</p>
                <p className="text-xs text-[var(--color-text-muted)]">회</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-bg-surface)] p-5 ring-1 ring-[var(--color-border)] flex flex-col gap-1">
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">총 좋아요</p>
                <p className="text-xl sm:text-2xl font-bold text-[var(--color-accent)]">{tracks.reduce((s, t) => s + (t.like_count ?? 0), 0).toLocaleString()}</p>
                <p className="text-xs text-[var(--color-text-muted)]">개</p>
              </div>
            </div>

            {/* 내 트랙 분석 — 본인 페이지에서만 표시 */}
            {currentUserId !== null && currentUserId === artistUserId && (
              <ArtistAnalytics />
            )}

            <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
              <ul className="grid grid-cols-1 gap-2">
                {tracks.map((track) => {
                  const isCurrentTrack = currentTrack?.id === track.id;
                  const canEdit = currentUserId !== null && currentUserId === track.user_id;
                  return (
                    <TrackRow
                      key={track.id}
                      coverColor={pickCoverColor(track.id)}
                      coverUrl={track.cover_url ?? undefined}
                      title={track.title ?? "제목 없음"}
                      artist={track.artist ?? "Unknown Artist"}
                      isActive={isCurrentTrack}
                      onClick={() => handlePlay(track)}
                      trailing={
                        <>
                          <div className="flex items-center gap-3 shrink-0 text-xs text-[var(--color-text-muted)]">
                            <span className="flex items-center gap-1">
                              <Play className="h-3 w-3" strokeWidth={1.5} />
                              {formatKoreanNumber(track.play_count ?? 0)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" strokeWidth={1.5} />
                              {formatKoreanNumber(track.like_count ?? 0)}
                            </span>
                          </div>
                          <Link
                            href={`/track/${track.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]"
                            aria-label="댓글 보기"
                          >
                            <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                          </Link>
                          <ShareButton trackId={track.id} artistName={track.artist ?? "Unknown Artist"} />
                          {!canEdit && <ReportButton trackId={track.id} />}
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setEditingTrack(track); }}
                                className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]"
                                aria-label="편집"
                              >
                                <Pencil className="h-5 w-5" strokeWidth={1.5} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); void handleDelete(track); }}
                                disabled={deletingId === track.id}
                                className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                                aria-label="삭제"
                              >
                                <Trash2 className="h-5 w-5" strokeWidth={1.5} />
                              </button>
                            </>
                          )}
                        </>
                      }
                    />
                  );
                })}
              </ul>
            </section>

            {/* 아티스트 소식 */}
            {artistUserId && (
              <ArtistPostFeed
                artistUserId={artistUserId}
                currentUserId={currentUserId}
                isOwnProfile={currentUserId === artistUserId}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

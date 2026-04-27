"use client";

import { Play, Heart, Music2, Upload, Plus, X, Disc3, Pencil, BarChart2 } from "lucide-react";
import Link from "next/link";
import { formatKoreanNumber } from "@/utils/formatNumber";
import { UploadButton } from "@/components/UploadButton";
import { AddToPlaylistButton } from "@/components/AddToPlaylistButton";
import type { DbAlbum } from "@/types/album";
import type { MyTrack } from "@/hooks/useMyPageData";

interface ArtistTabProps {
  myTracks: MyTrack[];
  myAlbums: DbAlbum[];
  showCreateAlbum: boolean;
  setShowCreateAlbum: (v: boolean) => void;
  newAlbumTitle: string;
  setNewAlbumTitle: (v: string) => void;
  creatingAlbum: boolean;
  userNickname: string | null;
  currentTrackId: string | undefined;
  loadData: () => Promise<void>;
  handleCreateAlbum: () => void;
  onEditTrack: (track: MyTrack) => void;
}

export function ArtistTab({
  myTracks,
  myAlbums,
  showCreateAlbum,
  setShowCreateAlbum,
  newAlbumTitle,
  setNewAlbumTitle,
  creatingAlbum,
  userNickname,
  currentTrackId,
  loadData,
  handleCreateAlbum,
  onEditTrack,
}: ArtistTabProps) {
  return (
    <div className="space-y-6">
      {myTracks.length === 0 ? (
        /* 업로드 없음 — CTA */
        <section className="rounded-2xl bg-[var(--color-bg-surface)] p-10 text-center ring-1 ring-[var(--color-border)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-subtle)]">
            <Upload className="h-7 w-7 text-[var(--color-accent)]" strokeWidth={1.5} />
          </div>
          <p className="text-base font-bold text-[var(--color-text-primary)]">아직 올린 곡이 없어요</p>
          <p className="mt-1 mb-5 text-sm text-[var(--color-text-secondary)]">
            첫 번째 곡을 올리고 아티스트로 활동을 시작해 보세요.
          </p>
          <div className="flex justify-center">
            <UploadButton onUploadSuccess={loadData} />
          </div>
        </section>
      ) : (
        <>
          {/* 내 앨범 */}
          <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Disc3 className="h-4 w-4 text-[var(--color-text-muted)]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  내 앨범 ({myAlbums.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateAlbum(true)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] transition hover:text-[var(--color-accent)] hover:ring-[var(--color-accent)]"
              >
                <Plus className="h-3.5 w-3.5" />
                앨범 만들기
              </button>
            </div>

            {/* 앨범 생성 인라인 폼 */}
            {showCreateAlbum && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-[var(--color-bg-base)] p-3 ring-1 ring-[var(--color-accent)]">
                <input
                  type="text"
                  value={newAlbumTitle}
                  onChange={(e) => setNewAlbumTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateAlbum()}
                  placeholder="앨범 제목"
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateAlbum}
                  disabled={!newAlbumTitle.trim() || creatingAlbum}
                  className="rounded-lg bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {creatingAlbum ? "저장 중…" : "만들기"}
                </button>
                <button type="button" onClick={() => { setShowCreateAlbum(false); setNewAlbumTitle(""); }}>
                  <X className="h-4 w-4 text-[var(--color-text-muted)]" />
                </button>
              </div>
            )}

            {myAlbums.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">아직 앨범이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {myAlbums.map((album) => (
                  <Link
                    key={album.id}
                    href={`/album/${album.id}`}
                    className="flex items-center gap-3 rounded-xl bg-[var(--color-bg-base)] px-4 py-3 transition hover:bg-[var(--color-bg-hover)]"
                  >
                    <Disc3 className="h-8 w-8 shrink-0 text-[var(--color-accent)]" strokeWidth={1.5} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{album.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">앨범</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 내 트랙 목록 */}
          <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Music2 className="h-4 w-4 text-[var(--color-text-muted)]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  내 트랙 ({myTracks.length})
                </h2>
              </div>
              <UploadButton onUploadSuccess={loadData} />
            </div>
            <ul className="flex flex-col gap-1">
              {myTracks.map((track) => {
                const isCurrentTrack = currentTrackId === track.id;
                const coverColor = "from-purple-700 to-purple-900";
                return (
                  <li
                    key={track.id}
                    className={`flex items-center gap-4 rounded-xl px-4 py-3 transition hover:bg-[var(--color-bg-hover)] ${
                      isCurrentTrack ? "bg-white/5 ring-1 ring-[var(--color-accent)]/30" : ""
                    }`}
                  >
                    <div className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${coverColor}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{track.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{track.artist}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" strokeWidth={1.5} />
                        {formatKoreanNumber(track.play_count ?? 0)}
                      </span>
                      <span className="flex items-center gap-1 text-[var(--color-accent)]">
                        <Heart className="h-3 w-3" strokeWidth={1.5} fill="currentColor" />
                        {formatKoreanNumber(track.like_count ?? 0)}
                      </span>
                    </div>
                    <AddToPlaylistButton trackId={track.id} />
                    <button
                      type="button"
                      onClick={() => onEditTrack(track)}
                      className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]"
                      title="곡 정보 수정"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 아티스트 분석 바로가기 */}
          {userNickname && (
            <Link
              href={`/artist/${encodeURIComponent(userNickname)}`}
              className="flex items-center justify-between rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)] transition hover:ring-[var(--color-accent)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-subtle)]">
                  <BarChart2 className="h-5 w-5 text-[var(--color-accent)]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">아티스트 분석 대시보드</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">재생수 · 좋아요 · 팔로워 통계 확인</p>
                </div>
              </div>
              <span className="text-[var(--color-text-muted)]">→</span>
            </Link>
          )}
        </>
      )}
    </div>
  );
}

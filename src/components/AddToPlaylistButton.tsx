"use client";

import { useState, useEffect } from "react";
import { ListPlus, X, Plus, Check } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePlaylistActions } from "@/hooks/usePlaylistActions";

interface AddToPlaylistButtonProps {
  trackId: string;
}

export function AddToPlaylistButton({ trackId }: AddToPlaylistButtonProps) {
  const [open, setOpen] = useState(false);
  const {
    playlists, loading, newTitle, setNewTitle,
    creating, added, showCreate, setShowCreate,
    isSuccess, error,
    fetchPlaylists, handleAdd, handleCreate,
  } = usePlaylistActions(trackId);

  // Auto-close after successful add
  useEffect(() => {
    if (isSuccess) {
      const id = setTimeout(() => setOpen(false), 1000);
      return () => clearTimeout(id);
    }
  }, [isSuccess]);

  const handleOpen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
    await fetchPlaylists();
  };

  return (
    <>
      <div>
        <button
          type="button"
          onClick={(e) => void handleOpen(e)}
          className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]"
          aria-label="플레이리스트에 추가"
          title="플레이리스트에 추가"
        >
          {isSuccess ? (
            <Check className="h-4 w-4 text-green-500" strokeWidth={2} />
          ) : (
            <ListPlus className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[var(--color-bg-surface)] p-5 shadow-2xl ring-1 ring-[var(--color-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--color-text-primary)]">플레이리스트에 추가</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <LoadingState />
            ) : (
              <>
                {playlists.length === 0 && !showCreate ? (
                  <div className="mb-3">
                    <EmptyState title="플레이리스트가 없습니다." description="새로 만들어 보세요." />
                  </div>
                ) : (
                  <ul className="mb-3 max-h-52 space-y-1 overflow-y-auto">
                    {playlists.map((pl) => (
                      <li key={pl.id} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-[var(--color-bg-hover)]">
                        <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-text-primary)]">{pl.title}</span>
                        {added[pl.id] ? (
                          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--color-accent)]">
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                            추가됨
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleAdd(pl.id)}
                            className="shrink-0 rounded-lg bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
                          >
                            추가
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {showCreate ? (
                  <form onSubmit={(e) => void handleCreate(e)} className="flex gap-2">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="플레이리스트 이름"
                      maxLength={100}
                      autoFocus
                      className="flex-1 rounded-xl bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)] focus:outline-none focus:ring-[var(--color-accent)]"
                    />
                    <button
                      type="submit"
                      disabled={!newTitle.trim() || creating}
                      className="rounded-xl bg-[var(--color-accent)] px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      생성
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    새 플레이리스트 만들기
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

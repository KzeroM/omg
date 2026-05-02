"use client";

import { useEffect, useState } from "react";
import { Send, Rss } from "lucide-react";
import { ArtistPostCard } from "./ArtistPostCard";

interface ArtistPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  users: { nickname: string | null } | null;
}

interface Props {
  artistUserId: string | null;
  currentUserId: string | null;
  isOwnProfile: boolean;
}

export function ArtistPostFeed({ artistUserId, currentUserId, isOwnProfile }: Props) {
  const [posts, setPosts] = useState<ArtistPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artistUserId) { setLoading(false); return; }
    void fetch(`/api/artist-posts?userId=${artistUserId}`)
      .then((r) => r.json())
      .then((d: { posts: ArtistPost[] }) => {
        setPosts(d.posts ?? []);
        setLoading(false);
      });
  }, [artistUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newPost.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/artist-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json() as { post?: ArtistPost; error?: string };
    if (!res.ok || !data.post) {
      setError(data.error ?? "포스트 등록에 실패했습니다.");
    } else {
      setPosts((prev) => [data.post!, ...prev]);
      setNewPost("");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/artist-posts/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <section className="rounded-2xl bg-[var(--color-bg-surface)] p-6 ring-1 ring-[var(--color-border)]">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]">
        <Rss className="h-5 w-5" strokeWidth={1.5} />
        아티스트 소식
        {posts.length > 0 && (
          <span className="text-sm font-normal text-[var(--color-text-muted)]">({posts.length})</span>
        )}
      </h2>

      {/* Post form (own profile only) */}
      {isOwnProfile && (
        <form onSubmit={(e) => void handleSubmit(e)} className="mb-5">
          <div className="relative">
            <textarea
              value={newPost}
              onChange={(e) => { setNewPost(e.target.value); setError(null); }}
              rows={3}
              maxLength={1000}
              placeholder="팬들에게 소식을 전해보세요… (최대 1,000자)"
              className="w-full rounded-xl bg-[var(--color-bg-elevated)] px-4 py-3 pr-12 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] ring-1 ring-[var(--color-border)] focus:outline-none focus:ring-[var(--color-accent)] resize-none"
            />
            <span className="absolute bottom-3 right-12 text-xs text-[var(--color-text-muted)]">
              {newPost.length}/1000
            </span>
            <button
              type="submit"
              disabled={!newPost.trim() || submitting}
              className="absolute bottom-3 right-3 rounded-lg p-1.5 bg-[var(--color-accent)] text-white transition hover:opacity-90 disabled:opacity-40"
              aria-label="포스트 등록"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </form>
      )}

      {/* Post list */}
      {loading ? (
        <div className="space-y-4 py-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 py-4 border-b border-[var(--color-border)]">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[var(--color-bg-elevated)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-bg-elevated)]" />
                <div className="h-4 w-full animate-pulse rounded bg-[var(--color-bg-elevated)]" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-bg-elevated)]" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-10 text-center">
          <Rss className="mx-auto mb-2 h-8 w-8 text-[var(--color-text-muted)]" strokeWidth={1} />
          <p className="text-sm text-[var(--color-text-muted)]">
            {isOwnProfile ? "아직 소식이 없습니다. 첫 글을 작성해보세요!" : "아직 소식이 없습니다."}
          </p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <ArtistPostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDelete={(id) => void handleDelete(id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

import { getTopArtists } from "@/utils/supabase/server-tracks";

export async function HeroBanner() {
  const artists = await getTopArtists();

  if (artists.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-bg-surface)] via-[var(--color-bg-base)] to-[var(--color-bg-base)] p-8 ring-1 ring-[var(--color-border)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(168,85,247,0.15),transparent)]" />
      <div className="relative">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-[var(--color-accent)]">
          Featured
        </h2>
        <h1 className="mb-6 text-2xl font-bold text-[var(--color-text-primary)] md:text-3xl">
          오늘의 인기 아티스트
        </h1>
        <div className="flex flex-wrap gap-4">
          {artists.map((artist) => (
            <div
              key={artist.id}
              className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 transition hover:ring-[var(--color-accent)]/50"
              style={{ borderLeft: `3px solid ${artist.color}` }}
            >
              <div
                className="h-10 w-10 rounded-full opacity-90"
                style={{ backgroundColor: artist.color }}
              />
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">{artist.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{artist.tagline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

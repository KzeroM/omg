import type { TopArtist } from "@/utils/supabase/tracks";

interface TopArtistsChartProps {
  artists: TopArtist[];
}

export default function TopArtistsChart({ artists }: TopArtistsChartProps) {
  if (!artists.length) return null;

  const maxCount = Math.max(...artists.map(a => a.count));

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 uppercase tracking-wide">
        TOP 아티스트
      </h3>
      <ul className="space-y-2">
        {artists.map((artist, index) => (
          <li
            key={artist.artist}
            className="flex items-center gap-4 rounded-xl py-3 px-4 transition hover:bg-white/5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-sm font-bold text-[var(--color-accent)]">
              {index + 1}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[var(--color-text-primary)]">
                {artist.artist}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-[var(--color-text-muted)]">
                {artist.count}회
              </span>
              <div className="w-20 h-2 rounded-full bg-[var(--color-bg-hover)] overflow-hidden">
                <div
                  className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
                  style={{ width: `${(artist.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import Link from "next/link";
import { TOP_CHART, type ChartTrack } from "@/data/chart";
import { getTopChartTracks } from "@/utils/supabase/tracks";
import { createClient } from "@/utils/supabase/client";
import { usePlayer } from "@/context/PlayerContext";
import { FoundingMemberBadge } from "./FoundingMemberBadge";
import { TierBadge } from "./TierBadge";
import { ShareButton } from "./ShareButton";

/** 실시간 TOP 5 차트 - play_count 기반 (Supabase 연동, 없으면 샘플 데이터) */
export function Chart() {
  const [tracks, setTracks] = useState<ChartTrack[]>(TOP_CHART);
  const [live, setLive] = useState(false);
  const { playSingleTrack, currentTrack } = usePlayer();

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    const supabase = createClient();

    getTopChartTracks().then((result) => {
      if (result.length > 0) {
        setTracks(result);
        setLive(true);
      }
    });

    const channel = supabase
      .channel("chart-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tracks" },
        () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            getTopChartTracks().then((result) => {
              if (result.length > 0) {
                setTracks(result);
              }
            });
          }, 300);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section id="chart" className="rounded-2xl bg-[#141414] p-6 ring-1 ring-[#1f1f1f]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">실시간 TOP 5 차트</h2>
        {live && (
          <span className="flex items-center gap-1.5 rounded-full bg-[#A855F7]/10 px-3 py-1 text-xs font-medium text-[#A855F7]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A855F7] animate-pulse" />
            LIVE
          </span>
        )}
      </div>
      {tracks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1f1f1f] py-12 text-center">
          <p className="text-sm text-zinc-500">아직 재생 기록이 없어요.</p>
          <p className="mt-1 text-sm text-zinc-600">곡을 재생하면 차트에 반영됩니다.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-2">
          {tracks.map((track) => (
            <li
              key={track.id}
              onClick={() => void playSingleTrack(track as any)}
              className={`flex items-center gap-4 rounded-xl py-3 px-4 transition cursor-pointer ${
                currentTrack?.id === track.id ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#A855F7]/20 text-sm font-bold text-[#A855F7]">
                {track.rank}
              </span>
              <div
                className={`h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br ${track.coverColor}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{track.title}</p>
                <p className="flex flex-wrap items-center gap-2 truncate text-sm text-zinc-400">
                  <Link
                    href={`/artist/${encodeURIComponent(track.uploader_nickname ?? track.artist)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-[#A855F7] transition"
                  >
                    {track.artist}
                  </Link>
                  {track.isFoundingMember && <FoundingMemberBadge />}
                  <TierBadge tier={track.artist_tier ?? 'basic'} size="sm" />
                </p>
              </div>
              {track.play_count != null && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-500">
                  <Play className="h-3 w-3" strokeWidth={1.5} />
                  {track.play_count.toLocaleString()}
                </span>
              )}
              <ShareButton trackId={track.id} artistName={track.artist} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

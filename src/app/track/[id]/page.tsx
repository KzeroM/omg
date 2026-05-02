import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import TrackPageClient from "./TrackPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("tracks")
    .select("title, artist, cover_url")
    .eq("id", id)
    .single();

  if (!data) return { title: "트랙 | OMG" };

  const title = (data.title as string | null) ?? "Unknown";
  const artist = (data.artist as string | null) ?? "Unknown Artist";
  const cover = data.cover_url as string | null;

  return {
    title: `${title} — ${artist} | OMG`,
    description: `${artist}의 "${title}" — OMG에서 들어보세요.`,
    openGraph: {
      title: `${title} — ${artist}`,
      description: `OMG에서 "${title}" 감상하기`,
      images: cover ? [{ url: cover }] : [],
      type: "music.song",
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title: `${title} — ${artist}`,
      description: `OMG에서 "${title}" 감상하기`,
      images: cover ? [cover] : undefined,
    },
  };
}

export default function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <TrackPageClient params={params} />;
}

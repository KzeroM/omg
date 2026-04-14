import { supabase } from "@/lib/supabase";
import type { PlaylistTrack } from "@/types/player";

const MUSIC_BUCKET = "music";

/** Supabase tracks 테이블 예시: id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id), file_path text not null, title text, created_at timestamptz default now(); RLS: user_id = auth.uid() */

/**
 * MP3 파일을 music 버킷에 업로드하고 tracks 테이블에 저장합니다.
 * 로그인 필요. 반환된 트랙은 file_path로 재생 시 signed URL을 사용합니다.
 */
export async function uploadTrackToSupabase(file: File): Promise<PlaylistTrack> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${user.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(MUSIC_BUCKET)
    .upload(filePath, file, { contentType: file.type ?? "audio/mpeg", upsert: false });

  if (uploadError) throw uploadError;

  const title = file.name.replace(/\.mp3$/i, "") || "제목 없음";
  const { data: row, error: insertError } = await supabase
    .from("tracks")
    .insert({ user_id: user.id, file_path: filePath, title })
    .select("id, file_path, title")
    .single();

  if (insertError) throw insertError;

  return {
    id: row.id,
    rank: 0,
    title: row.title ?? title,
    artist: "업로드 곡",
    coverColor: "from-[#A855F7] to-[#6366f1]",
    isFoundingMember: false,
    file_path: row.file_path,
  };
}

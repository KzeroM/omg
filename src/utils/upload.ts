"use client";

import { createClient } from "@/utils/supabase/client";
import { MAX_FILE_SIZE_BYTES } from "@/utils/audioValidation";
import type { PlaylistTrack } from "@/types/player";

const MUSIC_BUCKET = "omg-tracks";

/**
 * MP3 파일을 music 버킷에 업로드하고 tracks 테이블에 저장합니다.
 * 로그인 필요. artist_id에 현재 로그인한 유저의 ID가 저장됩니다.
 * 반환된 트랙은 file_path로 재생 시 signed URL을 사용합니다.
 */
export async function uploadTrackToSupabase(
  file: File,
  artist = "업로드 곡",
  titleOverride?: string,
  onProgress?: (step: 'uploading' | 'inserting' | 'done') => void,
): Promise<PlaylistTrack> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("파일 크기는 50MB를 초과할 수 없습니다.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${user.id}/${Date.now()}-${safeName}`;

  onProgress?.('uploading');
  const { error: uploadError } = await supabase.storage
    .from(MUSIC_BUCKET)
    .upload(filePath, file, { contentType: file.type ?? "audio/mpeg", upsert: false });

  if (uploadError) throw uploadError;

  const title = titleOverride?.trim() || file.name.replace(/\.(mp3|m4a|mp4|wav|flac|ogg)$/i, "") || "제목 없음";
  onProgress?.('inserting');
  const { data: row, error: insertError } = await supabase
    .from("tracks")
    .insert({
      user_id: user.id,
      artist_id: user.id,
      file_path: filePath,
      title,
      artist,
    })
    .select("id, file_path, title, artist")
    .single();

  if (insertError) throw insertError;

  onProgress?.('done');
  return {
    id: row.id,
    rank: 0,
    title: row.title ?? title,
    artist: row.artist ?? artist,
    coverColor: "from-[#A855F7] to-[#6366f1]",
    isFoundingMember: false,
    file_path: row.file_path,
  };
}

import { requireAdmin } from "@/utils/api/auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const MUSIC_BUCKET = "omg-tracks";
const BYTES_IN_MB = 1024 * 1024;

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  // 트랙 테이블에서 file_path, user_id, 업로더 닉네임 조회
  const { data: tracks } = await getAdminClient()
    .from("tracks")
    .select("id, file_path, user_id, title, users!user_id(nickname)")
    .order("created_at", { ascending: false });

  if (!tracks) return NextResponse.json({ totalMb: 0, fileCount: 0, byUser: [] });

  // 스토리지 파일 목록 조회 (파일 크기 포함)
  const { data: files } = await getAdminClient().storage
    .from(MUSIC_BUCKET)
    .list("", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });

  // 파일 경로 → 크기 맵
  const sizeMap = new Map<string, number>();
  let totalBytes = 0;
  for (const file of files ?? []) {
    const size = (file.metadata as Record<string, unknown> | null)?.size as number | undefined ?? 0;
    sizeMap.set(file.name, size);
    totalBytes += size;
  }

  // 사용자별 집계
  const userMap = new Map<string, { nickname: string; fileCount: number; totalBytes: number; tracks: { id: string; title: string | null; filePath: string }[] }>();

  for (const track of tracks) {
    const uid = track.user_id as string;
    const nickname = (track.users as { nickname?: string } | null)?.nickname ?? "Unknown";
    const filePath = track.file_path as string | null;
    const fileName = filePath?.split("/").pop() ?? "";
    const fileSize = sizeMap.get(fileName) ?? sizeMap.get(filePath ?? "") ?? 0;

    const existing = userMap.get(uid);
    if (existing) {
      existing.fileCount += 1;
      existing.totalBytes += fileSize;
      existing.tracks.push({ id: track.id as string, title: track.title as string | null, filePath: filePath ?? "" });
    } else {
      userMap.set(uid, {
        nickname,
        fileCount: 1,
        totalBytes: fileSize,
        tracks: [{ id: track.id as string, title: track.title as string | null, filePath: filePath ?? "" }],
      });
    }
  }

  const byUser = [...userMap.entries()]
    .map(([userId, info]) => ({
      userId,
      nickname: info.nickname,
      fileCount: info.fileCount,
      totalMb: parseFloat((info.totalBytes / BYTES_IN_MB).toFixed(2)),
      tracks: info.tracks.slice(0, 5),
    }))
    .sort((a, b) => b.totalMb - a.totalMb);

  return NextResponse.json({
    totalMb: parseFloat((totalBytes / BYTES_IN_MB).toFixed(2)),
    fileCount: tracks.length,
    byUser,
  });
}

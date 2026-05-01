"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { uploadTrackToSupabase, type TrackVisibility } from "@/utils/upload";
import { setTrackTags } from "@/utils/supabase/tags";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/utils/supabase/client";

/** ID3v2 태그에서 TIT2(제목), TPE1(아티스트)를 추출합니다. */
async function extractId3Tags(file: File): Promise<{ title?: string; artist?: string }> {
  try {
    const slice = file.slice(0, 131072);
    const buffer = await slice.arrayBuffer();
    const view = new DataView(buffer);

    if (
      view.getUint8(0) !== 0x49 ||
      view.getUint8(1) !== 0x44 ||
      view.getUint8(2) !== 0x33
    ) return {};

    const tagSize =
      ((view.getUint8(6) & 0x7f) << 21) |
      ((view.getUint8(7) & 0x7f) << 14) |
      ((view.getUint8(8) & 0x7f) << 7) |
      (view.getUint8(9) & 0x7f);

    const result: { title?: string; artist?: string } = {};
    let offset = 10;
    const end = Math.min(tagSize + 10, buffer.byteLength - 10);

    while (offset < end) {
      const frameId = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3),
      );
      const frameSize = view.getUint32(offset + 4);
      if (frameSize === 0 || frameId === "\0\0\0\0") break;

      if (frameId === "TIT2" || frameId === "TPE1") {
        const encoding = view.getUint8(offset + 10);
        const textStart = offset + 11;
        const textLength = frameSize - 1;
        if (textStart + textLength <= buffer.byteLength) {
          const textBytes = new Uint8Array(buffer, textStart, textLength);
          let text: string;
          if (encoding === 1 || encoding === 2) {
            text = new TextDecoder("utf-16").decode(textBytes);
          } else if (encoding === 3) {
            text = new TextDecoder("utf-8").decode(textBytes);
          } else {
            text = new TextDecoder("latin1").decode(textBytes);
          }
          text = text.replace(/\0/g, "").trim();
          if (frameId === "TIT2" && text) result.title = text;
          if (frameId === "TPE1" && text) result.artist = text;
        }
      }

      if (result.title && result.artist) break;
      offset += 10 + frameSize;
    }

    return result;
  } catch {
    return {};
  }
}

export interface UseTrackUploadReturn {
  isLoggedIn: boolean | null;
  loading: boolean;
  profileNickname: string;
  pendingFile: File | null;
  trackTitle: string;
  setTrackTitle: (v: string) => void;
  artistName: string;
  setArtistName: (v: string) => void;
  visibility: TrackVisibility;
  setVisibility: (v: TrackVisibility) => void;
  uploadStep: null | "uploading" | "inserting";
  uploadError: string | null;
  coverFile: File | null;
  coverPreview: string | null;
  selectedTagIds: string[];
  setSelectedTagIds: (ids: string[]) => void;
  isSuggestingTags: boolean;
  suggestTags: () => Promise<void>;
  handleAudioChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearCover: () => void;
  handleConfirm: () => Promise<void>;
  cancelUpload: () => void;
}

export function useTrackUpload({
  onUploadSuccess,
  onToast,
}: {
  onUploadSuccess?: () => void | Promise<void>;
  onToast: (msg: string) => void;
}): UseTrackUploadReturn {
  const { loadTracksFromDB } = usePlayer();

  const { isLoggedIn, profileNickname } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [trackTitle, setTrackTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [visibility, setVisibility] = useState<TrackVisibility>("public");
  const [uploadStep, setUploadStep] = useState<null | "uploading" | "inserting">(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

  // Cover preview ObjectURL
  useEffect(() => {
    if (!coverFile) { setCoverPreview(null); return; }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const handleAudioChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { e.target.value = ""; return; }

    try {
      const buffer = await file.slice(0, 16).arrayBuffer();
      const magicBytes = Array.from(new Uint8Array(buffer));
      const res = await fetch("/api/tracks/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: file.size, mimeType: file.type, magicBytes }),
      });
      const validation = await res.json() as { ok: boolean; message?: string };
      if (!validation.ok) {
        onToast(validation.message ?? "파일 검증에 실패했습니다.");
        e.target.value = "";
        return;
      }
    } catch (err) {
      onToast(err instanceof Error ? err.message : "파일 검증 중 오류가 발생했습니다.");
      e.target.value = "";
      return;
    }

    const tags = await extractId3Tags(file);
    const guessedTitle = file.name.replace(/\.mp3$/i, "");
    setTrackTitle(tags.title || guessedTitle);
    setArtistName(tags.artist || profileNickname || "");
    setUploadStep(null);
    setUploadError(null);
    setCoverFile(null);
    setPendingFile(file);
    e.target.value = "";
  }, [profileNickname, onToast]);

  const handleCoverChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("이미지 파일만 선택할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("커버 이미지는 5MB 이하여야 합니다.");
      return;
    }
    setCoverFile(file);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingFile) return;
    const file = pendingFile;
    const artist = artistName.trim() || "Unknown Artist";
    const title = trackTitle.trim() || file.name.replace(/\.mp3$/i, "") || "제목 없음";
    setUploadError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const hasSupabaseEnv =
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (hasSupabaseEnv && user) {
      setLoading(true);
      try {
        const track = await uploadTrackToSupabase(file, artist, title, (step) => {
          setUploadStep(step);
        }, visibility, coverFile ?? undefined);
        if (selectedTagIds.length > 0) {
          await setTrackTags(track.id, selectedTagIds);
        }
        await loadTracksFromDB();
        await onUploadSuccess?.();
        setPendingFile(null);
        setCoverFile(null);
        setUploadStep(null);
        setSelectedTagIds([]);
      } catch (err) {
        const msg = err instanceof Error ? err.message
          : (err as { message?: string })?.message
          ?? JSON.stringify(err);
        setUploadError(msg);
        setUploadStep(null);
      } finally {
        setLoading(false);
      }
    } else {
      setUploadError("로그인 후 업로드할 수 있습니다.");
    }
  }, [pendingFile, artistName, trackTitle, visibility, coverFile, loadTracksFromDB, onUploadSuccess]);

  const suggestTags = useCallback(async () => {
    if (!trackTitle && !artistName) return;
    setIsSuggestingTags(true);
    try {
      const res = await fetch("/api/tracks/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trackTitle, artist: artistName }),
      });
      const data = await res.json() as { tagIds?: string[] };
      if (data.tagIds && data.tagIds.length > 0) {
        setSelectedTagIds(data.tagIds);
      }
    } catch {
      // AI 제안 실패는 조용히 처리 — 수동 선택으로 대체
    } finally {
      setIsSuggestingTags(false);
    }
  }, [trackTitle, artistName]);

  const clearCover = useCallback(() => setCoverFile(null), []);

  const cancelUpload = useCallback(() => {
    setPendingFile(null);
    setCoverFile(null);
    setUploadError(null);
    setUploadStep(null);
    setSelectedTagIds([]);
  }, []);

  return {
    isLoggedIn, loading, profileNickname,
    pendingFile, trackTitle, setTrackTitle, artistName, setArtistName,
    visibility, setVisibility, uploadStep, uploadError,
    coverFile, coverPreview,
    selectedTagIds, setSelectedTagIds, isSuggestingTags, suggestTags,
    handleAudioChange, handleCoverChange, clearCover, handleConfirm, cancelUpload,
  };
}

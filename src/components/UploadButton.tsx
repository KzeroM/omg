"use client";

import { useRef, useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { createClient } from "@/utils/supabase/client";
import { uploadTrackToSupabase } from "@/utils/upload";
import { Toast } from "./Toast";
import { AuthModal } from "./AuthModal";

/** ID3v2 태그에서 TIT2(제목), TPE1(아티스트)를 추출합니다. */
async function extractId3Tags(file: File): Promise<{ title?: string; artist?: string }> {
  try {
    // 최대 128KB만 읽음 (일반적인 ID3 태그는 수 KB 이내)
    const slice = file.slice(0, 131072);
    const buffer = await slice.arrayBuffer();
    const view = new DataView(buffer);

    // ID3v2 헤더 확인: "ID3"
    if (
      view.getUint8(0) !== 0x49 || // I
      view.getUint8(1) !== 0x44 || // D
      view.getUint8(2) !== 0x33    // 3
    ) return {};

    // syncsafe integer로 태그 크기 계산
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
      // 프레임 크기 (ID3v2.3: 4바이트 big-endian, ID3v2.4: syncsafe)
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

export function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { addUploadedTrack, addTrack } = usePlayer();
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [trackTitle, setTrackTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [uploadStep, setUploadStep] = useState<null | 'uploading' | 'inserting' | 'done'>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "audio/mpeg") { e.target.value = ""; return; }

    // ID3 태그 추출 시도
    const tags = await extractId3Tags(file);
    const guessedTitle = file.name.replace(/\.mp3$/i, "");
    setTrackTitle(tags.title || guessedTitle);
    setArtistName(tags.artist || "");
    setPendingFile(file);
    e.target.value = "";
  };

  const handleConfirm = async () => {
    if (!pendingFile) return;
    const file = pendingFile;
    const artist = artistName.trim() || "Unknown Artist";
    const title = trackTitle.trim() || file.name.replace(/\.mp3$/i, "") || "제목 없음";
    setPendingFile(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const hasSupabaseEnv =
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (hasSupabaseEnv && user) {
      setLoading(true);
      try {
        const track = await uploadTrackToSupabase(file, artist, title, (step) => {
          setUploadStep(step);
        });
        addTrack(track);
        setToast("업로드 성공");
      } catch (err) {
        const msg = err instanceof Error ? err.message
          : (err as { message?: string })?.message
          ?? JSON.stringify(err);
        setToast(msg);
        setUploadStep(null);
      } finally {
        setLoading(false);
      }
    } else {
      addUploadedTrack(file, artist);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        className="hidden"
        onChange={handleChange}
        disabled={loading}
      />
      <button
        type="button"
        onClick={() => {
          if (isLoggedIn === false) {
            setShowAuthModal(true);
            return;
          }
          inputRef.current?.click();
        }}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-[#A855F7] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#9333ea] disabled:opacity-60"
      >
        <Upload className="h-4 w-4" strokeWidth={2} />
        {loading ? "업로드 중…" : "곡 올리기"}
      </button>

      {showAuthModal && (
        <AuthModal
          initialMode="login"
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}

      {/* 곡 정보 입력 모달 */}
      {pendingFile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#141414] p-6 ring-1 ring-[#1f1f1f]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">곡 정보 입력</h3>
              <button
                type="button"
                onClick={() => setPendingFile(null)}
                disabled={uploadStep !== null}
                className="rounded-lg p-1 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 truncate text-sm text-zinc-400">{pendingFile.name}</p>

            <label className="mb-1 block text-xs text-zinc-500">곡 제목</label>
            <input
              type="text"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              placeholder="곡 제목을 입력하세요"
              disabled={uploadStep !== null}
              className="mb-3 w-full rounded-xl bg-[#1f1f1f] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none ring-1 ring-[#2a2a2a] focus:ring-[#A855F7] disabled:opacity-60 disabled:cursor-not-allowed"
              autoFocus
            />

            <label className="mb-1 block text-xs text-zinc-500">아티스트명</label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              placeholder="아티스트명을 입력하세요"
              disabled={uploadStep !== null}
              className="mb-4 w-full rounded-xl bg-[#1f1f1f] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none ring-1 ring-[#2a2a2a] focus:ring-[#A855F7] disabled:opacity-60 disabled:cursor-not-allowed"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingFile(null)}
                disabled={uploadStep !== null}
                className="flex-1 rounded-xl bg-[#1f1f1f] py-2.5 text-sm text-zinc-400 transition hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                취소
              </button>
              {uploadStep === null ? (
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 rounded-xl bg-[#A855F7] py-2.5 text-sm font-medium text-white transition hover:bg-[#9333ea]"
                >
                  업로드
                </button>
              ) : uploadStep === 'uploading' ? (
                <div className="flex-1 rounded-xl bg-[#A855F7] py-2.5 text-sm font-medium text-white flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  서버에 업로드 중...
                </div>
              ) : uploadStep === 'inserting' ? (
                <div className="flex-1 rounded-xl bg-[#A855F7] py-2.5 text-sm font-medium text-white flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  정보 저장 중...
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingFile(null)}
                  className="flex-1 rounded-xl bg-[#A855F7] py-2.5 text-sm font-medium text-white transition hover:bg-[#9333ea]"
                >
                  완료
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

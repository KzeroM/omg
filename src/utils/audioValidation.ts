export const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/flac",
  "audio/ogg",
] as const;

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

/** 첫 16바이트로 실제 오디오 포맷 확인. 일치하면 MIME, 불일치 시 null */
export function checkMagicBytes(bytes: Uint8Array): string | null {
  // MP3: ID3 헤더
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return "audio/mpeg";
  // MP3: sync word
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return "audio/mpeg";
  // FLAC
  if (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) return "audio/flac";
  // WAV (RIFF)
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return "audio/wav";
  // OGG
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return "audio/ogg";
  // MP4/M4A: ftyp box at offset 4
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "audio/mp4";
  return null;
}

export interface ValidationResult {
  ok: boolean;
  errorCode?: "FILE_TOO_LARGE" | "INVALID_MIME" | "INVALID_MAGIC_BYTES";
  message?: string;
}

export function validateAudioFileMeta(input: {
  size: number;
  mimeType: string;
  magicBytes: number[];
}): ValidationResult {
  if (input.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, errorCode: "FILE_TOO_LARGE", message: "파일 크기는 50MB를 초과할 수 없습니다." };
  }
  if (!ALLOWED_MIME_TYPES.includes(input.mimeType as typeof ALLOWED_MIME_TYPES[number])) {
    return { ok: false, errorCode: "INVALID_MIME", message: "허용되지 않는 파일 형식입니다. MP3, M4A, WAV, FLAC, OGG만 지원합니다." };
  }
  const detected = checkMagicBytes(new Uint8Array(input.magicBytes));
  if (!detected) {
    return { ok: false, errorCode: "INVALID_MAGIC_BYTES", message: "파일 내용이 오디오 형식과 일치하지 않습니다." };
  }
  return { ok: true };
}

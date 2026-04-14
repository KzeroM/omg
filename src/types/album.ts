/** FAC-51: Album 관련 타입 정의 */

/** cover_type 값 */
export type AlbumCoverType = 'gradient' | 'image';

/** DB albums 테이블 행 */
export interface DbAlbum {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_type: AlbumCoverType;
  cover_image_path: string | null;
  created_at: string;
  updated_at: string;
}

/** DB album_tracks 테이블 행 */
export interface DbAlbumTrack {
  album_id: string;
  track_id: string;
  position: number;
  added_at: string;
}

/** 앨범 상세 조회 시 트랙 목록 포함 */
export interface AlbumWithTracks extends DbAlbum {
  tracks: AlbumTrackItem[];
}

/** 앨범 내 트랙 항목 (position 순 정렬용) */
export interface AlbumTrackItem {
  track_id: string;
  position: number;
  added_at: string;
  title: string | null;
  artist: string | null;
  file_path: string;
}

/** 앨범 생성 요청 페이로드 */
export interface CreateAlbumRequest {
  title: string;
  description?: string | null;
  cover_type?: AlbumCoverType;
  cover_image_path?: string | null;
}

/** 앨범 수정 요청 페이로드 */
export interface UpdateAlbumRequest {
  title?: string;
  description?: string | null;
  cover_type?: AlbumCoverType;
  cover_image_path?: string | null;
}

/** manage_album_tracks RPC 응답 */
export interface ManageAlbumTracksResult {
  success: boolean;
  action?: 'added' | 'removed';
  error?: string;
}

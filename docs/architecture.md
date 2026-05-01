---
title: OMG — 아키텍처
tags: [omg, architecture]
updated: 2026-05-01
---

# 아키텍처

## 기술 스택

| 레이어   | 기술                                                                  |
| ----- | ------------------------------------------------------------------- |
| 프레임워크 | Next.js 16 (App Router) + TypeScript                                |
| 스타일   | Tailwind CSS v4                                                     |
| 백엔드   | Supabase (Auth, PostgreSQL, Storage, Realtime)                      |
| AI    | Groq API (취향 분석 문장 생성)                                              |
| 상태관리  | React Context (PlayerContext · ToastContext) + TanStack React Query |
| 배포    | Vercel (https://omg-iota.vercel.app)                                |

---

## 디렉토리 구조

```
src/
├── app/
│   ├── page.tsx                         # 홈 (HeroBanner + Chart + NewReleases + AlbumGrid)
│   ├── layout.tsx                       # 글로벌 레이아웃 (Header + Sidebar + PlayerBar + BottomNav)
│   ├── loading.tsx                      # 전역 로딩 스켈레톤
│   ├── chart/page.tsx                   # 차트 전체 페이지 (가중치·태그 필터)
│   ├── search/page.tsx                  # 검색 (텍스트 + 태그 복합 필터)
│   ├── library/page.tsx                 # 내 보관함 (업로드 트랙)
│   ├── my/page.tsx                      # 마이페이지 (리스너탭 + 아티스트탭)
│   ├── settings/page.tsx                # 설정 (닉네임 · 프로필 이미지 · 비밀번호)
│   ├── artist/[name]/page.tsx           # 아티스트 페이지 (전곡 + 통계 + 팔로우)
│   ├── track/[id]/page.tsx              # 트랙 상세 + 댓글
│   ├── album/[id]/page.tsx              # 앨범 상세
│   ├── playlist/[id]/page.tsx           # 플레이리스트 상세
│   ├── admin/
│   │   ├── layout.tsx                   # 어드민 레이아웃 + 사이드바
│   │   ├── page.tsx                     # 어드민 통계 대시보드
│   │   ├── tracks/page.tsx
│   │   ├── users/page.tsx
│   │   ├── featured/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── announcements/page.tsx
│   │   ├── storage/page.tsx
│   │   └── tiers/page.tsx
│   └── api/
│       ├── tracks/[id]/comments/        # 트랙 댓글 CRUD
│       ├── tracks/validate/             # 오디오 파일 서버 검증
│       ├── playlists/                   # 플레이리스트 생성/조회
│       ├── playlists/[id]/              # 상세/수정/삭제
│       ├── playlists/[id]/tracks/       # 트랙 추가/삭제
│       ├── search/                      # 통합 검색
│       ├── report/                      # 트랙 신고
│       ├── follow/[artistId]/           # 팔로우/언팔로우
│       ├── notifications/               # 알림 조회
│       ├── announcements/               # 공지사항 조회
│       ├── auth/
│       │   ├── check-nickname/
│       │   ├── set-nickname/
│       │   └── update-nickname/
│       ├── admin/
│       │   ├── tracks/[id]/
│       │   ├── users/[id]/ · users/[id]/ban/ · users/[id]/admin/ · users/[id]/tier/
│       │   ├── featured/
│       │   ├── reports/
│       │   ├── announcements/ · announcements/[id]/
│       │   ├── storage/
│       │   └── artists-list/
│       └── user/
│           ├── taste-description/       # Groq 취향 분석
│           ├── recommendations/         # 태그 기반 추천
│           ├── taste-tags/              # 취향 태그 집계
│           ├── analytics/               # 아티스트 분석
│           ├── profile/                 # 프로필 수정
│           ├── onboarding/              # 온보딩 데이터 저장
│           └── delete/                  # 계정 삭제
├── components/
│   ├── TrackRow.tsx                     # 트랙 행 공통 컴포넌트 (leading/subtitle/trailing 슬롯)
│   ├── PlayerBar.tsx                    # 하단 플레이어 바
│   ├── MobileFullscreenPlayer.tsx       # 모바일 풀스크린 플레이어 (슬라이드업)
│   ├── QueuePanel.tsx                   # 재생 큐 패널 (드래그 앤 드롭)
│   ├── QueueAwareMain.tsx               # 큐 열림 상태에 따른 레이아웃 조정
│   ├── Chart.tsx                        # 실시간 TOP 5 차트
│   ├── NewReleases.tsx                  # 최신 트랙 피드
│   ├── NewReleasesChart.tsx             # 최신 등록곡 차트 (홈)
│   ├── HeroBanner.tsx                   # 홈 피처드 아티스트 배너
│   ├── AlbumCard.tsx                    # 앨범 카드
│   ├── AlbumGrid.tsx                    # 앨범 그리드 (클라이언트)
│   ├── AlbumGridServer.tsx              # 앨범 그리드 (서버 컴포넌트)
│   ├── DiscoverySection.tsx             # 태그 브라우징 섹션
│   ├── DiscoverySectionServer.tsx
│   ├── FollowedArtistsFeed.tsx          # 팔로우 아티스트 신곡 피드
│   ├── AnnouncementBanner.tsx           # 공지사항 홈 배너
│   ├── Header.tsx                       # 상단 헤더
│   ├── Sidebar.tsx                      # 데스크톱 사이드바
│   ├── BottomNav.tsx                    # 모바일 하단 탭바
│   ├── AuthModal.tsx                    # 로그인/회원가입 모달
│   ├── OnboardingModal.tsx              # 신규 가입 온보딩 4단계
│   ├── EditTrackModal.tsx               # 트랙 정보 편집 모달
│   ├── UploadButton.tsx                 # 트랙 업로드 버튼
│   ├── TagSelector.tsx                  # 태그 멀티셀렉트
│   ├── TierBadge.tsx                    # basic / silver / gold / diamond 배지
│   ├── FoundingMemberBadge.tsx          # 창립 멤버 배지
│   ├── LikeButton.tsx                   # 좋아요 (낙관적 업데이트)
│   ├── FollowButton.tsx                 # 팔로우/언팔로우
│   ├── ShareButton.tsx                  # Web Share API + 클립보드 폴백
│   ├── ReportButton.tsx                 # 신고 모달
│   ├── AddToPlaylistButton.tsx          # 플레이리스트 추가 모달
│   ├── NotificationBell.tsx             # 알림 센터
│   ├── TasteAnalysis.tsx                # Groq 취향 분석 카드
│   ├── MyVibeSection.tsx                # My Vibe 취향 태그 시각화
│   ├── ArtistAnalytics.tsx              # 아티스트 분석 대시보드
│   ├── Last7DaysChart.tsx               # 7일 재생 차트
│   ├── TopArtistsChart.tsx              # 상위 아티스트 차트
│   ├── Toast.tsx                        # 토스트 알림
│   ├── AuthVerifiedToast.tsx            # 이메일 인증 완료 토스트
│   ├── QueryProvider.tsx                # TanStack Query Provider
│   ├── auth/
│   │   ├── SignupSuccessScreen.tsx
│   │   └── VerificationScreen.tsx
│   ├── skeletons/
│   │   ├── AlbumGridSkeleton.tsx
│   │   ├── DiscoverySkeleton.tsx
│   │   ├── HeroBannerSkeleton.tsx
│   │   └── SkeletonRow.tsx
│   ├── tabs/
│   │   ├── ListenerTab.tsx              # 마이페이지 리스너 탭
│   │   └── ArtistTab.tsx                # 마이페이지 아티스트 탭
│   └── ui/
│       ├── EmptyState.tsx
│       ├── ErrorState.tsx
│       └── LoadingState.tsx
├── context/
│   ├── PlayerContext.tsx                # 플레이어 통합 컨텍스트 (audio 상태 + 큐/메타)
│   └── ToastContext.tsx
├── hooks/
│   ├── useAuth.ts                       # 인증 상태 조회
│   ├── useAuthModal.ts                  # AuthModal 열기/닫기 + 로그인 플로우
│   ├── useChartTracks.ts                # 차트 트랙 조회 (React Query)
│   ├── useLikeTrack.ts                  # 좋아요 토글 (낙관적 업데이트)
│   ├── useMyPageData.ts                 # 마이페이지 데이터 통합 훅
│   ├── useNewTracks.ts                  # 최신 트랙 조회
│   ├── usePlayHistory.ts                # 재생 기록 추가
│   ├── usePlaylistActions.ts            # 플레이리스트 CRUD 액션
│   └── useTrackUpload.ts                # 트랙 업로드 (ID3 추출·검증·업로드)
├── utils/
│   ├── supabase/
│   │   ├── client.ts                    # Supabase 브라우저 클라이언트
│   │   ├── server.ts                    # Supabase 서버 클라이언트
│   │   ├── tracks.ts                    # 트랙 CRUD · RPC
│   │   ├── server-tracks.ts             # 서버사이드 트랙/아티스트 쿼리
│   │   ├── storage.ts                   # Signed URL 발급
│   │   ├── tags.ts · tags.server.ts     # 태그 쿼리
│   │   ├── tiers.ts                     # 아티스트 티어 쿼리
│   │   ├── albums.ts                    # 앨범 클라이언트 쿼리
│   │   └── albums.server.ts             # 앨범 서버 쿼리
│   ├── api/
│   │   ├── auth.ts                      # requireAuth / requireAdmin 헬퍼
│   │   └── types.ts                     # ApiResponse<T> · ApiError · apiError()
│   ├── audioValidation.ts               # 오디오 MIME·크기·포맷 검증
│   ├── coverColor.ts                    # 트랙 커버 색상 결정
│   ├── formatNumber.ts                  # 한국식 숫자 포맷 (1.2만)
│   ├── localStorage.ts                  # 게스트 재생목록·히스토리
│   ├── share.ts                         # Web Share API + 클립보드
│   ├── rateLimiter.ts                   # Supabase RPC 기반 Rate Limiter
│   ├── notifications.ts                 # 알림 헬퍼 (notifyFollowers 등)
│   ├── nickname.ts                      # 닉네임 검증·생성
│   ├── user.ts                          # 유저 유틸
│   └── upload.ts                        # 업로드 유틸
├── constants/
│   ├── ui.ts                            # CATEGORY_KO · VISIBILITY_LABELS · PERIOD_LABELS
│   └── survey.ts                        # 온보딩 설문 옵션 데이터
├── lib/
│   ├── supabase.ts                      # Supabase admin 클라이언트 (service_role)
│   └── upload.ts                        # 서버사이드 업로드 유틸
├── types/
│   ├── player.ts                        # PlaylistTrack · DbTrack · HistoryTrack
│   ├── album.ts                         # AlbumWithTracks · AlbumCoverType
│   ├── tag.ts                           # Tag · TrackTag
│   ├── tier.ts                          # ArtistTier
│   └── user.ts                          # UserProfile · OnboardingData
└── data/
    └── chart.ts                         # 차트 fallback 데이터
```

---

## DB 스키마

### `tracks`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| user_id | UUID → auth.users | 업로드한 유저 |
| file_path | TEXT | Supabase Storage 경로 |
| title | TEXT | 곡 제목 |
| artist | TEXT | 아티스트 표시명 |
| play_count | INTEGER | 누적 재생수 |
| like_count | INTEGER | 좋아요 수 (RPC로만 증감) |
| is_public | BOOLEAN | 공개 여부 |
| visibility | TEXT | 'public' / 'followers' / 'private' |
| cover_url | TEXT | 커버 이미지 URL (nullable) |
| artist_tier | TEXT | basic / silver / gold / diamond |
| created_at | TIMESTAMPTZ | |

### `users`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| user_id | UUID → auth.users | PK |
| nickname | TEXT | |
| avatar_url | TEXT | |
| bio | TEXT | |
| social_links | JSONB | Instagram · Twitter · YouTube · 기타 |
| is_admin | BOOLEAN | |
| is_banned | BOOLEAN | |
| artist_tier | TEXT | |
| follower_count | INTEGER | 캐시 |
| birth_date | DATE | 온보딩 수집 |
| gender | TEXT | 온보딩 수집 |
| purpose | TEXT | 온보딩 수집 |
| referral | TEXT | 온보딩 수집 |

### `albums` / `album_tracks`
| 테이블 | 주요 컬럼 |
|--------|----------|
| albums | id · user_id · title · description · cover_type · cover_image_path |
| album_tracks | album_id · track_id · position |

### 기타 테이블
`track_likes` · `play_history` · `user_playlist` · `follows` · `tags` · `track_tags` · `artist_tags` · `notifications` · `announcements` · `playlists` · `playlist_tracks` · `track_comments` · `reports` · `featured_artists` · `profiles`

> 상세 컬럼: 초기 스키마는 [[sprints/sprint-v1]] 참조

---

## RPC 함수

| 함수 | 설명 |
|------|------|
| `increment_play_count(track_id)` | play_count 원자적 +1 |
| `toggle_track_like(p_track_id)` | 좋아요 토글 — like_count 트랜잭션, `{ liked, like_count }` 반환 |
| `manage_album_tracks(...)` | 앨범 트랙 일괄 관리 (SECURITY DEFINER) |
| `get_chart_tracks(p_period, p_tag_ids, p_limit)` | 가중치 기반 차트 — plays×0.4 + likes×0.6, 기간·태그 필터 |
| `upsert_play_history(p_track_id)` | 재생 기록 upsert (비로그인 no-op) |
| `rate_limit_check(...)` | API 요청 빈도 제한 (Supabase RPC 기반) |

## Storage

- 버킷: `omg-tracks`
- 접근: Signed URL (재생 시마다 발급)

---

## 컨텍스트 구조

### `PlayerContext`
오디오 상태와 큐/메타 상태를 하나의 파일에서 관리. 내부적으로 audio ref와 queue state를 분리.

| 상태 | 설명 |
|------|------|
| `isPlaying` | 재생 여부 |
| `currentTime / duration` | 재생 위치 / 전체 길이 |
| `volume` | 볼륨 |
| `isLoading` | 트랙 로딩 중 |
| `publicTracks` | 전체 공개 트랙 |
| `queue` | 현재 재생 큐 |
| `currentTrack` | 현재 재생 곡 |
| `shuffleEnabled / repeatMode` | 셔플 / 반복 모드 |
| `likedTrackIds / likeCounts` | 좋아요 상태 캐시 |

---

## 데이터 흐름

### 재생 흐름
```
클릭 → PlayerContext.playTrack()
  → Supabase Storage signed URL 발급
  → HTMLAudioElement.play()
  → increment_play_count() RPC
  → addPlayHistory() 기록
  → (비로그인) 60초 후 미리듣기 종료
```

### 차트 실시간 갱신
```
tracks 테이블 변경
  → Supabase Realtime postgres_changes
  → debounce 300ms
  → getTopChartTracks() 재조회
  → Chart 리렌더
```

### 좋아요 흐름 (낙관적 업데이트)
```
클릭 → 로컬 상태 즉시 반전
  → toggle_track_like() RPC
  → RPC 결과로 교정 / 실패 시 롤백
```

### 인증 분기
```
로그인 O → 전체 재생, DB 재생목록, 업로드, 소셜 기능
로그인 X → 1분 미리듣기, localStorage 재생목록/히스토리
```

### API 인증 패턴 (v10B~)
```
모든 인증 필요 API 라우트
  → requireAuth(req) → { user } | NextResponse(401)
  → requireAdmin(req) → { user } | NextResponse(403)
```

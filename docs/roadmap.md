---
title: OMG — 로드맵
tags: [omg, roadmap]
updated: 2026-05-01
---

# 로드맵

> 완료된 스프린트 이력. 예정 작업은 [[backlog]] 참조.

---

## v1 — 핵심 플레이어 루프 (~2026-04-13)

- [x] Supabase 트랙 자동 로드
- [x] Library ↔ PlayerContext 재생 연동
- [x] seekbar canPlay 버그 수정
- [x] togglePlay stale state 버그 수정
- [x] 모바일 seekbar
- [x] 실시간 TOP 5 차트 (Supabase Realtime)
- [x] 트랙 좋아요 (낙관적 업데이트 + RPC)
- [x] 비로그인 게스트 모드 (1분 미리듣기)
- [x] 아티스트 프로필 페이지 + 팔로우
- [x] MP3 ID3 태그 자동 추출, 업로드 진행률, 검색, 재생 히스토리, 트랙 공유
- [x] Shuffle / Repeat, 큐 패널, 아티스트 통계, RLS 전수 감사

> 스프린트 상세: [[sprints/sprint-v1]]

---

## v2 — 마이페이지 · 앨범 DB · 취향 분석 (2026-04-14)

- [x] 앨범 DB 스키마 + 마이그레이션
- [x] 리스너 마이페이지 (`/my`) 신설
- [x] 디자인 시스템 토큰 + 전체 UI 리팩터
- [x] 취향 분석 기능 (Groq AI)
- [x] 아티스트 페이지 배너 개선

→ [[sprints/sprint-v2]]

---

## v3 — 태그 시스템 · 큐 패널 · 설정 고도화 (2026-04-19)

- [x] 태그 시스템 DB (`tags` · `track_tags` · `artist_tags`)
- [x] 트랙/아티스트 태그 부착 UI
- [x] 취향 분석 엔진 (태그 집계 → Groq)
- [x] 태그 기반 추천
- [x] 재생목록(큐) 패널
- [x] Storage 재생 URL 정책 수정
- [x] 마이페이지·설정 페이지 고도화

→ [[sprints/sprint-v3]]

---

## v4 — 어드민 · 소셜 · 플레이리스트 · 댓글 · 신고 (2026-04-19~20)

- [x] PlayerContext 분리 (audio / queue)
- [x] Rate Limiter → Supabase RPC 기반 교체
- [x] 검색 고도화 (태그 필터 + 자동완성)
- [x] 모바일 플레이어 UX + 풀스크린 플레이어
- [x] 알림 시스템 (30초 폴링)
- [x] 플레이리스트 (생성/편집/공유, 공개/비공개)
- [x] 어드민 전체 (인증·트랙·사용자·통계·피처드·등급·Groq비용·Storage·공지·신고)
- [x] 댓글 시스템 (타임스탬프 댓글)
- [x] QueuePanel 드래그 앤 드롭, TrackRow 공통 컴포넌트

→ [[sprints/sprint-v4]]

---

## v5 — 기술 기반 + 즉각 UX 개선 (2026-04-21~23)

- [x] React Query 캐시 레이어 (`@tanstack/react-query`, 서버 요청 ~50% 감소)
- [x] Supabase Realtime 알림 WebSocket 교체 (폴링 → channel, 지연 <200ms)
- [x] 오디오 업로드 검증 파이프라인 (MIME · 파일 크기 서버 검증)
- [x] Media Session API (잠금화면 재생 컨트롤)
- [x] Playwright E2E 테스트 기반 구축
- [x] Streaming SSR + Suspense 경계 (TTFB 40~60% 감소)

→ [[sprints/sprint-v5]]

---

## v6 — 핵심 기능 강화 (2026-04-25)

- [x] 가중치 인기 차트 (일간/주간/월간 + RPC)
- [x] 차트 태그 취향 필터 패널
- [x] 아티스트 분석 기간 선택 (7d/30d/90d)
- [x] 팔로우 신곡 피드 (FollowedArtistsFeed)
- [x] 댓글 DB 완성 (track_comments + FK 교체)
- [x] 댓글 삭제 API + 소유자 확인 UI

→ [[sprints/sprint-v6]]

---

## v7 — 마이페이지 개편 + 온보딩 + 개인화 (2026-04-26)

- [x] 비로그인 마이페이지 로그인 유도 UI (무한로딩 수정)
- [x] 최신 등록곡 홈 이동 (차트에서 제거 → 차트 = 순위만)
- [x] 마이페이지 리스너/아티스트 2탭 분리
- [x] 스켈레톤 UI 전체 적용 (6개 페이지)
- [x] 온보딩 4단계 모달 (birth_date · gender · purpose · referral · 태그)
- [x] My Vibe — 취향 태그 시각화 + 개인화 차트 연결
- [x] 앨범 단위 관리 (manage_album_tracks RPC + 아티스트 탭 UI)
- [x] 트랙 공개 설정 (visibility 컬럼)
- [x] 신곡 업로드 시 팔로워 알림 (notifyFollowers)

→ [[sprints/sprint-v7]]

---

## v8 — UX 퀄리티 (2026-04-27)

- [x] 한국식 숫자 포맷 (`1.2만` 전역 적용)
- [x] 스켈레톤 로딩 고도화 (레이아웃 시프트 제거)
- [x] 홈/차트 메뉴 차별화 (진입점 · 레이아웃 구분)
- [x] 좋아요 버튼 인라인 피드백 (펄스 애니메이션)
- [x] 성공/에러 상태 인라인 표시 (토스트 대신 버튼 체크마크)

---

## v11 — 커뮤니티 + UX (2026-05-01~)

**Empty State 통일**
- [x] FAC-105 EmptyState 컴포넌트 action(CTA) prop 추가
- [x] FollowedArtistsFeed 빈 상태 UI + "차트에서 아티스트 찾기" CTA
- [x] ListenerTab 좋아요/플레이리스트 빈 상태 EmptyState로 통일
- [x] FAC-133 커버아트 업로드 (UploadButton 기존 구현 확인)
- [x] FAC-173 업로드 모달 위치 UX (85dvh 기존 구현 확인)

**테마**
- [x] FAC-118 Dark/Light 테마 토글 (next-themes + 설정 페이지 UI)

**AI 기능**
- [x] FAC-120 업로드 AI 자동 태그 제안 (Groq + TagSelector 통합, 업로드 시 tag 저장)

**커뮤니티**
- [x] FAC-121 이모지 반응 (🔥😍🎵💯 — track_reactions DB + React Query 낙관적 업데이트 + 풀스크린/PlayerBar)

**재방문율**
- [x] FAC-122 일일 로그인 스트릭 (users 컬럼 + API + 헤더 불꽃 배지 🔥N)

**운영**
- [x] FAC-129 운영진 문의 기능 (support_tickets DB + 사용자 폼 + 어드민 답변 UI)

**트랙 페이지**
- [x] FAC-124 트랙 전용 페이지 고도화 (커버아트·태그·EmojiReactions·가사·크레딧·SEO 메타)

→ [[sprints/sprint-v11]] · PR #37 · PR #38 · PR #39 · PR #40 · PR #41 · PR #42 · PR #43

---

## v12 — 오디오 + 발견 (2026-05-02~)

**가사**
- [x] FAC-125 가사 드로어 (플레이어에서 가사 보기 — LyricsDrawer 컴포넌트, 모바일/데스크톱)

→ [[sprints/sprint-v12]] · PR #44

---

## v10 — 버그 수정 + 리팩토링 + 기능 추가 (2026-04-27 ~ 05-01)

**버그 수정**
- [x] `/playlist/[id]` 상세 페이지 생성
- [x] `AddToPlaylistButton` added 상태 리셋 버그
- [x] 마이페이지 내 트랙 편집(EditTrackModal) 복구

**리팩토링 R1~R8**
- [x] R1: `requireAuth`/`requireAdmin` 헬퍼 + 25개 API 라우트 적용 (-91줄)
- [x] R2: `ApiResponse<T>` · `ApiError` · `apiError()` 타입 유틸 신규
- [x] R3: `my/page.tsx` 625→212 LOC (`useMyPageData` + `ListenerTab` + `ArtistTab`)
- [x] R4: `PlayerContext` 711→649 LOC (`useLikeTrack` + `usePlayHistory` 추출)
- [x] R5: `UploadButton` 400→170 LOC (`useTrackUpload`)
- [x] R6: `AuthModal` 408→160 LOC (`useAuthModal` + `SignupSuccessScreen` + `VerificationScreen`)
- [x] R7: `useAuth` + `usePlaylistActions` 신규, `AddToPlaylistButton` 순수 UI화
- [x] R8: `constants/ui.ts` 신규 — 레이블 상수 중앙화

**기능 추가**
- [x] FAC-177 featured_artists 관리 UI (이미 구현됨 확인)
- [x] FAC-178 커버 이미지 TrackRow/PlayerBar 표시 (PR #36)

→ [[sprints/sprint-v10]]

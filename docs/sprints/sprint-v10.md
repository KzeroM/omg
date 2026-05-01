---
title: Sprint v10 — 버그 수정 (v10A) + 리팩토링 (v10B) + 기능 (v10C)
tags: [omg, sprint, v10, refactoring]
period: 2026-04-27 ~ 2026-05-01
status: 완료
items: 13
commits: [d7e7048, c5f206e, c4303a4, 7a15db5, b97b695, cb9f11f, 8a5105a, 3158e74, 57493ad]
---

# Sprint v10 — 버그 수정 + 리팩토링

> **목표**: v10A 즉시 버그 수정 + v10B 코드 정비로 v10C 기능 추가 기반 마련
> **완료**: 2026-04-27

---

## v10A — 즉시 버그 수정

| # | 작업 | 비고 |
|---|------|------|
| 174 | `/playlist/[id]` 상세 페이지 생성 | 플레이리스트 추가 후 내용 확인 불가 → 수정 |
| 175 | `AddToPlaylistButton` added 상태 리셋 | 재오픈 시 "추가됨" 고착 버그 수정 |
| 176 | EditTrackModal 복구 | library→/my 통합 후 편집 기능 사라진 것 복구 |

---

## v10B — 리팩토링 (R1~R8)

### Phase 1 — API 인증 통합

| # | 작업 | 결과 | 커밋 |
|---|------|------|------|
| R1 | `requireAuth`/`requireAdmin` 헬퍼 + 25개 라우트 적용 | -91줄, 코드 중복 제거 | d7e7048 |
| R2 | `ApiResponse<T>`, `ApiError`, `apiError()` 타입 유틸 | 타입 안전성 ↑ | c5f206e |

### Phase 2 — 대형 파일 분해

| # | 작업 | 결과 | 커밋 |
|---|------|------|------|
| R3 | `my/page.tsx` 625→212 LOC | `useMyPageData` + `ListenerTab` + `ArtistTab` | c4303a4 |
| R4 | `PlayerContext` 711→649 LOC | `useLikeTrack` + `usePlayHistory` 추출 | 7a15db5 |

### Phase 3 — 컴포넌트 hook 추출

| # | 작업 | 결과 | 커밋 |
|---|------|------|------|
| R5 | `UploadButton` 400→170 LOC | `useTrackUpload` (ID3·검증·업로드 로직) | b97b695 |
| R6 | `AuthModal` 408→160 LOC | `useAuthModal` + `SignupSuccessScreen` + `VerificationScreen` | cb9f11f |

### Phase 4 — hooks 확장 + 상수 중앙화

| # | 작업 | 결과 | 커밋 |
|---|------|------|------|
| R7 | `useAuth` + `usePlaylistActions` 신규 | `AddToPlaylistButton` 순수 UI화 | 8a5105a |
| R8 | `constants/ui.ts` 신규 | `CATEGORY_KO`, `VISIBILITY_LABELS`, `PERIOD_LABELS` 중앙화 | 3158e74 |

---

## 기술 부채 해소 요약

- API 라우트: 인증 보일러플레이트 ~91줄 제거, requireAuth/requireAdmin 패턴 일관화
- 대형 파일 3개 (my/page, PlayerContext, UploadButton) 각각 절반 이하로 축소
- hooks 디렉토리 새 파일: useMyPageData, useLikeTrack, usePlayHistory, useTrackUpload, useAuthModal, useAuth, usePlaylistActions (7개)
- 신규 컴포넌트: ListenerTab, ArtistTab, SignupSuccessScreen, VerificationScreen
- 상수 파일: constants/ui.ts

---

---

## v10C — 기능 추가 (2026-05-01)

| # | 작업 | 비고 | PR |
|---|------|------|-----|
| 177 | featured_artists 관리 UI | admin/featured/page.tsx 이미 구현됨 확인 | — |
| 178 | 커버 이미지 TrackRow/PlayerBar 표시 | coverUrl prop, img/gradient fallback, 5개 호출부 + tracks.ts SELECT 추가 | #36 |

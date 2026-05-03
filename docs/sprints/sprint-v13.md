---
title: Sprint v13 — 품질 개선
tags: [omg, sprint, v13, quality]
period: 2026-05-03 ~
status: 진행 중
items: 5
commits: [9d3fcc9, 7063695, 0e4e4fe, 35debac, 6b6cd51, 10151ec, 0c34ce5]
---

# Sprint v13 — 품질 개선

> **목표**: 사용자 경험 개선 및 기능 완성도 향상

---

## PR #48 — 라이너 노트 · 댓글 관리 · 업로드 FAB

| # | 작업 | 비고 |
|---|------|------|
| 139 | 업로드 FAB | 모바일 전역 고정 버튼, `variant=fab`, `lg:hidden` |
| 146 | 라이너 노트 | `tracks.liner_notes` DB 컬럼 + EditTrackModal + 트랙 페이지 표시 |
| 148 | 댓글 관리 권한 | 트랙 소유자도 댓글 삭제 가능 (Promise.all 병렬 소유권 체크) |

## PR #49 — 출시 예약 · pgvector

| # | 작업 | 비고 |
|---|------|------|
| 142 | 트랙 출시 예약 | `publish_at` datetime picker (업로드/편집 모달) + 공개 쿼리 필터 |
| 109 | pgvector 설정 | `vector` 확장 + `embedding vector(1536)` 컬럼. #120·#121 언블록 |

## PR #50 — 스와이프 제스처

| # | 작업 | 비고 |
|---|------|------|
| 137 | 트랙 행 스와이프 제스처 | 오른쪽→좋아요 (`toggleTrackLike`), 왼쪽→플리추가 (`addToUserPlaylist`). 방향 잠금으로 스크롤 충돌 방지 |

## PR #51 — 맞춤 차트

| # | 작업 | 비고 |
|---|------|------|
| 110 | 맞춤 차트 | 마운트 시 `preferred_tag_ids` 자동 로드 → `selectedTagIds` 초기값. "맞춤" 배지 표시 |

## PR #52 — 애니메이션 + 풀-투-리프레시

| # | 작업 | 비고 |
|---|------|------|
| 150 | 카운트업 애니메이션 | `AnimatedNumber` 컴포넌트 (ease-out cubic). 차트 재생횟수에 적용 |
| 140 | 풀-투-리프레시 | `usePullToRefresh` 훅. 차트 페이지에서 위로 당기면 React Query 무효화 |

## PR #53 — 업로드 UI + 프로필 개선

| # | 작업 | 비고 |
|---|------|------|
| 154 | 업로드 스텝 UI | UploadButton 모달에 2단계 진행 표시줄 (파일 업로드 → 저장) |
| 159 | 아티스트 프로필 개선 | 팔로워 카운트에 `AnimatedNumber` 적용 |

## PR #54 — 트랙 순서 재배열

| # | 작업 | 비고 |
|---|------|------|
| 149 | 프로필 내 트랙 순서 재배열 | DB `display_order` 컬럼 + `PATCH /api/tracks/reorder` + 아티스트 페이지 DnD UI (GripVertical) |

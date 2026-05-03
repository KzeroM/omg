---
title: Sprint v13 — 품질 개선
tags: [omg, sprint, v13, quality]
period: 2026-05-03 ~
status: 진행 중
items: 5
commits: [9d3fcc9, 7063695]
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

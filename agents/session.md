# Orchestrator 세션 체크포인트
업데이트: 2026-04-25

## 현재 스프린트: v6 (핵심 기능 강화) — **완료**

## 작업 현황

| 기능 | 브랜치 | PR | 단계 |
|------|--------|----|------|
| #1~3 차트 오버홀 (기간/태그/더보기/최신등록곡) | feat/FAC-116-chart-overhaul | #25 | ✅ 머지됨 |
| #4 큐 편집 UI | — | — | ✅ 이미 구현됨 (main) |
| #5 아티스트 분석 기간 선택 | feat/FAC-117-analytics-period | #26 | ✅ 머지됨 |
| #6 홈 피드 개인화 (팔로우 신곡) | feat/FAC-118-home-feed | #27 | ✅ 머지됨 |
| #7 트랙 댓글 | feat/FAC-119-track-comments | #28 | ✅ 머지됨 |
| #8 풀스크린 플레이어 (모바일) | — | — | ✅ 이미 구현됨 (main) |

## DB 마이그레이션 (이번 스프린트)
- `get_chart_tracks(p_period, p_tag_ids, p_limit)` RPC — 가중치 인기 차트
- `track_comments` 테이블 + RLS + timestamp_sec 컬럼
- `track_comments.user_id` → `public.users.user_id` FK (PostgREST 조인)

## 주요 아키텍처 규칙 (축적)
- `utils/supabase/*.ts`에 `./server` import 있으면 클라이언트 컴포넌트 import 금지
  → 서버 전용 함수는 `*.server.ts`로 분리 (tags.server.ts, albums.server.ts)

## 프로덕션
- URL: https://omg-iota.vercel.app ✅ READY
- 마지막 배포: v6 스프린트 완료 후

## 다음 스프린트 후보 (P2 기반 투자)
- 백로그 #109: pgvector 기반 추천 (Tier 1)
- 백로그 #110: Welcome Flow + Taste Quiz 온보딩 (Tier 2)
- 백로그 #111: 업로드 시 AI 자동 태그 생성 (Tier 2)

## 마지막 커밋
main @ merged v6 — PR #25~28 squash merged

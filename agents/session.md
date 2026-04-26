# Orchestrator 세션 체크포인트
업데이트: 2026-04-26

## 현재 스프린트: v7 (마이페이지 개편 + 온보딩 + 개인화)

## 작업 현황
| 이슈 | 브랜치 | 단계 | 비고 |
|------|--------|------|------|
| v7 신규-A (비로그인 마이페이지 UI) | feat/v7a-structure | ✅ PR #29 머지됨 | |
| v7 신규-D (최신 등록곡 → 홈) | feat/v7a-structure | ✅ PR #29 머지됨 | |
| v7 신규-C (마이페이지 2탭) | feat/v7b-mypage-tabs | ✅ PR #30 머지됨 | |
| v7 신규-B (스켈레톤 UI 전체) | feat/v7c-skeleton | ✅ PR #31 머지됨 | |
| #172 온보딩 플로우 | feat/v7d-onboarding | ✅ PR #32 머지됨 | DB migration 완료 |
| #123 My Vibe 취향 태그 시각화 | feat/v7e-myvibe | ✅ PR #33 머지됨 | /api/user/taste-tags + MyVibeSection |
| #128 앨범 단위 관리 | feat/v7f-album | ✅ PR #34 머지됨 | manage_album_tracks RPC + 아티스트 탭 UI |
| #144 신곡 업로드 시 팔로워 알림 | — | 🔜 미착수 | 다음 작업 |
| #141 트랙 공개 설정 | — | 🔜 미착수 | |

## v7 P1 완료 요약
- PR #32: 온보딩 4단계 모달 (referral→purpose→birth_date+gender→태그), DB migration (birth_date/gender/primary_purpose/referral_source/preferred_tag_ids), /api/user/onboarding, constants/survey.ts
- PR #33: My Vibe 취향 태그 시각화 (/api/user/taste-tags, MyVibeSection, Chart URL tag pre-selection, TasteAnalysis 스켈레톤)
- PR #34: 앨범 단위 관리 (manage_album_tracks SECURITY DEFINER RPC, 마이페이지 아티스트 탭 앨범 섹션, album/[id] 스켈레톤)

## 주요 아키텍처 규칙 (축적)
- `utils/supabase/*.ts`에 `./server` import 있으면 클라이언트 컴포넌트 import 금지
  → 서버 전용 함수는 `*.server.ts`로 분리
- 마이페이지 아티스트 탭 활성 조건: tracks 테이블에 user_id 트랙 존재 여부
- birth_date IS NULL = 온보딩 미완료 (onboarding_done 컬럼 불필요)
- DB 정수 코드: constants/survey.ts 단일 소스 관리

## 다음 할 일
1. #144 신곡 업로드 시 팔로워 알림 — notifications 테이블 재활용
2. #141 트랙 공개 설정 (비공개·팔로워·전체) — tracks.visibility 컬럼 추가

## 마지막 커밋
main @ 104cd3c — feat: 앨범 단위 관리 + 마이페이지 아티스트 탭 앨범 섹션 (PR #34)

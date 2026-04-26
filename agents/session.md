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
| #144 신곡 업로드 시 팔로워 알림 | feat/v7p2-artist-tools | ✅ PR #35 머지됨 | |
| #141 트랙 공개 설정 | feat/v7p2-artist-tools | ✅ PR #35 머지됨 | |

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

## v7 P2 완료 요약
- PR #35: 트랙 공개 설정(tracks.visibility 컬럼 + UploadButton 범위 선택 UI) + 신곡 팔로워 알림(notifyFollowers 헬퍼) + 차트/검색/아티스트 쿼리 visibility 필터

## Prod 배포 현황
- **배포 SHA**: f5c44ed (main HEAD)
- **상태**: READY ✅ — omg-iota.vercel.app
- **자동화**: GitHub Actions deploy.yml (VERCEL_TOKEN 시크릿 등록 완료)
  → main push 시 자동 배포

## 다음 할 일
- v7 스프린트 전체 완료 ✅, prod 배포 완료 ✅
- v8 스프린트 계획 (CEO 결정 필요)

## 마지막 커밋
main @ f5c44ed — ci: GitHub Actions Vercel 자동 배포 워크플로우 추가

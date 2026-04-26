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
| v7 신규-E (온보딩 플로우) | — | 🔜 미착수 | 다음 작업 |
| #123 My Vibe 개인화 차트 | — | 🔜 미착수 | |
| #128 앨범 단위 관리 | — | 🔜 미착수 | |

## DB 변경 예정 (신규-E 온보딩)
- `users.birth_date` date
- `users.gender` smallint (1=남성, 2=여성, 3=논바이너리, 4=응답안함)
- `users.primary_purpose` smallint (1=음악발견, 2=아티스트지원, 3=음악공유)
- `users.referral_source` smallint (1=SNS, 2=지인추천, 3=검색, 4=기타)
- constants/survey.ts 에서 단일 소스 관리

## 온보딩 플로우 (4단계, 스킵 불가)
1. "OMG를 어떻게 알게 됐나요?" → referral_source
2. "주로 무엇을 하실 건가요?" → primary_purpose
3. "생년월일 + 성별" → birth_date + gender
4. "좋아하는 장르" → 태그 다중 선택 (My Vibe 초기값)

## 주요 아키텍처 규칙 (축적)
- `utils/supabase/*.ts`에 `./server` import 있으면 클라이언트 컴포넌트 import 금지
  → 서버 전용 함수는 `*.server.ts`로 분리
- 마이페이지 아티스트 탭 활성 조건: tracks 테이블에 user_id 트랙 존재 여부

## 다음 할 일
1. 온보딩 플로우 구현 (신규-E) — DB migration + 컴포넌트 + 미들웨어/리다이렉트
2. My Vibe 취향 태그 시각화 + 개인화 차트 연결 (#123)
3. 앨범 단위 관리 (#128) — DB 스키마 + 아티스트 탭 UI

## 마지막 커밋
main @ 303ebe7 — feat: 스켈레톤 UI 전체 적용 (PR #31)

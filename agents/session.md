# Orchestrator 세션 체크포인트
업데이트: 2026-04-27

## 현재 스프린트: v10 준비

## 작업 현황
| 이슈 | 브랜치 | 단계 | 비고 |
|------|--------|------|------|
| 모바일 업로드 확인버튼 | main 직접 | ✅ c5bb684 | overflow-y-auto 제거로 click 캔슬 버그 수정 |
| GitHub Actions VERCEL_TOKEN | main 직접 | ✅ f3957d6 | secret 재설정 완료 |
| 플레이리스트 CTA | main 직접 | ✅ aa3bf4b | 추가 버튼 추가 |

## 다음 착수 순서 (backlog 로드맵 기준)

### v10A — 즉시 버그 (리팩토링 전)
1. #174 `/playlist/[id]` 상세 페이지 생성
2. #175 `AddToPlaylistButton` added 상태 리셋
3. #176 마이페이지 내 트랙 편집(EditTrackModal) 복구

### v10B — 리팩토링
- R1: API 인증 미들웨어 통합 (~20 라우트, 기계적)
- R2: API 공통 에러 핸들링 타입
- R3: `my/page.tsx` 분리 (597 LOC)
- R4: `PlayerContext.tsx` 분리 (~700 LOC)
- R5: `UploadButton.tsx` → hook 추출
- R6: `AuthModal.tsx` 화면별 분리
- R7: hooks 확장
- R8: constants 중앙화

### v10C — 기능
- #177 featured_artists 관리 UI
- #178 커버 이미지 TrackRow/PlayerBar

## Prod 배포 현황
- **배포 SHA**: c5bb684 (main HEAD)
- **상태**: READY — omg-iota.vercel.app

## 인프라 메모
- **GitHub PAT**: `.env.local` → `GITHUB_PAT=ghp_...`
- **VERCEL_TOKEN**: `vcp_...` (만료 없음) — GitHub Secret 정상 설정됨
- **VERCEL_PROJECT_ID**: `prj_fpnmfvlBUtbIK8asgbz9W3nVGUi0`
- **VERCEL_ORG_ID**: `team_uAZZxZn6kiF6HKa50GCp4lnK`

## 마지막 커밋
main @ c5bb684 — fix: 업로드 모달 overflow-y-auto 제거 — 모바일 click 캔슬 버그 수정

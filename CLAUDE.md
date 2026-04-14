# OMG — 프로젝트 컨텍스트

## 프로젝트 개요
한국 독립 아티스트를 위한 음악 스트리밍 & 차트 플랫폼.
아티스트가 직접 MP3를 업로드하고, 실시간 차트와 신곡 목록에 노출되는 구조.

## 기술 스택
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (Auth, Storage, PostgreSQL)
- **Icons**: lucide-react
- **Dev server**: `npm run dev` → http://localhost:3000

## 디렉토리 구조
```
src/
├── app/              # Next.js App Router 페이지
│   ├── page.tsx      # 홈 (HeroBanner + Chart + NewReleases)
│   └── library/      # 내 보관함 (/library)
├── components/       # UI 컴포넌트
├── context/          # PlayerContext (전역 재생 상태)
├── data/             # chart.ts (현재 하드코딩, Supabase 전환 예정)
├── lib/              # supabase.ts, upload.ts
├── types/            # player.ts (PlaylistTrack, DbTrack)
└── utils/supabase/   # client / server / storage 헬퍼
```

## 환경변수
`.env.local`에 Supabase URL/ANON_KEY 설정됨.

## 팀 구조
역할 정의는 `team/` 폴더 참조:
- `team/PO.md` — Product Owner
- `team/PM.md` — Product Manager
- `team/TechLead.md` — Tech Lead

## 도구 연동
- **Obsidian** (`C:\Users\zerom\Documents\Obsidian`) — 프로젝트 문서, 스펙, 의사결정 기록
- **Linear** — 스프린트 관리, 이슈 트래킹, 백로그

## 워크플로우
```
PO (Linear 백로그 우선순위 결정)
  → PM (Obsidian 스펙 문서 작성 + Linear 이슈에 링크)
    → Tech Lead (구현 + 리뷰 + 테스트 → Linear 이슈 완료 처리)
      → PO (Linear에서 완료 확인)
```

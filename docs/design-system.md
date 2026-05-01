---
title: OMG — 디자인 시스템
tags: [omg, design]
updated: 2026-05-01
---

# 디자인 시스템

> **Source of truth**: `src/app/globals.css`  
> 아이콘: `lucide-react` · 스타일: Tailwind CSS v4

---

## 색상 (Color)

### 배경

| 토큰 | 값 | 사용처 |
|------|-----|--------|
| `--color-bg-base` | `#0a0a0a` | 페이지 배경 |
| `--color-bg-surface` | `#141414` | 카드 · 패널 · 사이드바 |
| `--color-bg-elevated` | `#1f1f1f` | 드롭다운 · 툴팁 · 모달 |
| `--color-bg-hover` | `rgba(255,255,255,0.05)` | 호버 오버레이 |

> Spotify와 동일한 3단계 배경 계층 구조. surface → elevated 순서로 올라갈수록 밝아진다.

### 강조 (Accent)

| 토큰 | 값 | 사용처 |
|------|-----|--------|
| `--color-accent` | `#A855F7` | CTA 버튼 · 활성 탭 · 링크 |
| `--color-accent-hover` | `#9333ea` | 버튼 호버 상태 |
| `--color-accent-subtle` | `rgba(168,85,247,0.1)` | 선택 항목 배경 · 배지 Fill |

### 텍스트

| 토큰 | 값 | 사용처 |
|------|-----|--------|
| `--color-text-primary` | `#ffffff` | 헤딩 · 트랙명 · 버튼 레이블 |
| `--color-text-secondary` | `#a1a1aa` | 아티스트명 · 본문 · 설명 |
| `--color-text-muted` | `#71717a` | 메타데이터 · 타임스탬프 · 비활성 |

> 명도 대비: primary `#fff` / base `#0a0a0a` → 21:1 (WCAG AAA 충족)

### 경계선

| 토큰 | 값 | 사용처 |
|------|-----|--------|
| `--color-border` | `#1f1f1f` | 카드 테두리 · 구분선 · 입력 필드 |

### 시스템 상태

| 토큰 | 값 | 사용처 |
|------|-----|--------|
| `--color-success` | `#22c55e` | 업로드 완료 · 저장 성공 |
| `--color-success-subtle` | `rgba(34,197,94,0.1)` | 성공 메시지 배경 |
| `--color-error` | `#ef4444` | 오류 · 삭제 확인 |
| `--color-error-subtle` | `rgba(239,68,68,0.1)` | 에러 메시지 배경 |
| `--color-warning` | `#f59e0b` | 주의 · 미완료 |
| `--color-warning-subtle` | `rgba(245,158,11,0.1)` | 경고 메시지 배경 |

### 특수

| 토큰 | 값 | 사용처 |
|------|-----|--------|
| `--gold-badge` | `#fbbf24` | Gold 등급 아티스트 배지 |
| `--gold-badge-glow` | `rgba(251,191,36,0.4)` | 배지 글로우 그림자 |

---

## 타이포그래피 (Typography)

폰트: **Geist Sans** (Next.js 기본) · fallback: `system-ui, sans-serif`

### 사이즈 스케일 (Tailwind 클래스 기준)

| 클래스 | 크기 | 사용처 |
|--------|------|--------|
| `text-xs` | 12px | 태그 · 뱃지 · 타임스탬프 |
| `text-sm` | 14px | 보조 텍스트 · 메타데이터 · 버튼 small |
| `text-base` | 16px | 본문 기본 |
| `text-lg` | 18px | 섹션 서브타이틀 · 버튼 large |
| `text-xl` | 20px | 카드 제목 · 아티스트명 (대형) |
| `text-2xl` | 24px | 페이지 섹션 헤딩 |
| `text-3xl` | 30px | 페이지 타이틀 |

### 폰트 웨이트

| 클래스 | 값 | 사용처 |
|--------|----|--------|
| `font-normal` | 400 | 본문 |
| `font-medium` | 500 | 버튼 · 레이블 · 트랙명 |
| `font-semibold` | 600 | 섹션 제목 · 강조 |
| `font-bold` | 700 | 페이지 타이틀 |

### 라인 하이트

```
leading-tight    (1.25) — 헤딩, 한 줄 레이블
leading-snug     (1.375) — 카드 제목
leading-normal   (1.5)  — 본문 기본
leading-relaxed  (1.625) — 설명 텍스트, 댓글
```

---

## 간격 (Spacing)

4px 베이스 그리드. Tailwind 기본 스케일 사용.

| 값 | px | 사용처 |
|----|-----|--------|
| `1` | 4px | 아이콘 · 텍스트 간 미세 간격 |
| `2` | 8px | 인라인 요소 간격 · 배지 패딩 |
| `3` | 12px | 버튼 vertical padding (small) |
| `4` | 16px | 버튼 horizontal padding · 카드 내부 gap |
| `5` | 20px | 섹션 내부 padding |
| `6` | 24px | 카드 padding · 모달 padding |
| `8` | 32px | 섹션 간격 |
| `10` | 40px | 페이지 영역 padding |
| `12` | 48px | 대형 섹션 간격 |

---

## 모서리 (Border Radius)

| 토큰 | 값 | Tailwind | 사용처 |
|------|-----|----------|--------|
| `--radius-sm` | `6px` | `rounded` | 태그 · 배지 · 인풋 |
| `--radius-md` | `10px` | `rounded-lg` | 버튼 · 작은 카드 |
| `--radius-lg` | `14px` | `rounded-xl` | 카드 · 패널 · 모달 |
| `--radius-xl` | `20px` | `rounded-2xl` | 커버아트 · 대형 카드 |
| `--radius-full` | `9999px` | `rounded-full` | 아바타 · 알약형 버튼 |

---

## 그림자 (Shadow / Elevation)

다크 테마 최적화 — 밝은 그림자 대신 어두운 그림자 사용 (Spotify 방식).

| 토큰 | 값 | 사용처 |
|------|-----|--------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,.5)` | 호버 카드 |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,.6)` | 드롭다운 · 팝오버 |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,.7)` | 모달 · 플레이어 |
| `--shadow-glow` | `0 0 20px rgba(168,85,247,.3)` | 강조 버튼 · 활성 아이템 |

---

## z-index 스케일

| 토큰 | 값 | 레이어 |
|------|-----|--------|
| `--z-base` | 0 | 일반 컨텐츠 |
| `--z-above` | 1 | 겹침이 필요한 요소 (커버아트 오버레이 등) |
| `--z-dropdown` | 10 | 드롭다운 메뉴 |
| `--z-sticky` | 20 | 스티키 헤더 |
| `--z-overlay` | 30 | 딤 오버레이 |
| `--z-modal` | 40 | 모달 · 시트 |
| `--z-toast` | 50 | 토스트 알림 |
| `--z-player` | 100 | PlayerBar (항상 최상단) |

---

## 트랜지션 (Motion)

> 참고: Material Design의 "Standard Easing" + Spring 변형

| 토큰 | 값 | 사용처 |
|------|-----|--------|
| `--duration-fast` | `100ms` | 호버 색상 변화 · 아이콘 상태 |
| `--duration-normal` | `200ms` | 버튼 · 카드 호버 · 드롭다운 |
| `--duration-slow` | `350ms` | 모달 진입 · 슬라이드 패널 |
| `--ease-default` | `cubic-bezier(0.4,0,0.2,1)` | 대부분의 UI 전환 |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | 좋아요 펄스 · 팝업 등장 |

### 정의된 애니메이션 클래스

| 클래스 | 설명 |
|--------|------|
| `.animate-badge-shine` | Gold 배지 반짝임 (2s loop) |
| `.equalizer-bar-1/2/3` | 재생 중 이퀄라이저 (0.9s loop) |
| `.animate-like-heart-pulse` | 좋아요 클릭 하트 펄스 (0.35s once) |

---

## 아이콘 (Iconography)

라이브러리: `lucide-react`

| 규칙 | 값 |
|------|----|
| 기본 stroke width | `1.5` |
| 강조 stroke width | `2` |
| 소형 (인라인) | `size={14}` ~ `size={16}` |
| 기본 | `size={18}` ~ `size={20}` |
| 대형 (빈 상태 등) | `size={40}` ~ `size={48}` |

---

## 브레이크포인트

Tailwind 기본 스케일 사용.

| 접두사 | 최소 너비 | 타겟 |
|--------|----------|------|
| _(없음)_ | 0px | 모바일 (375px 기준 설계) |
| `sm:` | 640px | 대형 모바일 |
| `md:` | 768px | 태블릿 |
| `lg:` | 1024px | 데스크톱 |
| `xl:` | 1280px | 와이드 데스크톱 |

**모바일 우선** 원칙 — 기본 스타일은 375px, `lg:` 이상에서 확장.

---

## 레이아웃 고정값

| 토큰 | 값 | 설명 |
|------|-----|------|
| `--player-height` | `72px` | PlayerBar 높이 |
| `--sidebar-width` | `240px` | 사이드 내비게이션 너비 |
| `--topbar-height` | `56px` | 상단 바 높이 |

---

## 컴포넌트 패턴

### 버튼

```
Primary    bg-[--color-accent] hover:bg-[--color-accent-hover] rounded-lg px-4 py-2 text-sm font-medium
Secondary  bg-[--color-bg-elevated] hover:bg-[--color-bg-hover] border border-[--color-border]
Ghost      hover:bg-[--color-bg-hover] (배경 없음)
Danger     bg-[--color-error]/10 text-[--color-error] hover:bg-[--color-error]/20
```

### 카드

```
bg-[--color-bg-surface] rounded-xl border border-[--color-border] p-4
호버: hover:border-[--color-bg-elevated] hover:bg-[--color-bg-elevated] transition-colors duration-[--duration-normal]
```

### 입력 필드

```
bg-[--color-bg-elevated] border border-[--color-border] rounded-lg px-3 py-2 text-sm
포커스: focus:outline-none focus:ring-1 focus:ring-[--color-accent]
에러:   border-[--color-error] focus:ring-[--color-error]
```

### 배지 / 태그

```
일반:   bg-[--color-bg-elevated] text-[--color-text-secondary] text-xs rounded px-2 py-0.5
강조:   bg-[--color-accent-subtle] text-[--color-accent] text-xs rounded px-2 py-0.5
성공:   bg-[--color-success-subtle] text-[--color-success] text-xs rounded px-2 py-0.5
에러:   bg-[--color-error-subtle] text-[--color-error] text-xs rounded px-2 py-0.5
```

### 트랙 행 (TrackRow)

```
커버아트: h-12 w-12 rounded-lg overflow-hidden (이미지 또는 bg-gradient-to-br fallback)
레이아웃: flex items-center gap-3 p-2 hover:bg-[--color-bg-hover] rounded-lg
텍스트:   트랙명 font-medium text-sm / 아티스트명 text-xs text-[--color-text-secondary]
```

### 스켈레톤

```
bg-[--color-bg-elevated] animate-pulse rounded-{해당 컴포넌트와 동일한 radius}
```

### 빈 상태 (Empty State)

```
flex flex-col items-center gap-3 py-12 text-[--color-text-muted]
아이콘: lucide-react size={40} strokeWidth={1.5}
텍스트: text-sm
CTA:    text-[--color-accent] hover:underline text-sm
```

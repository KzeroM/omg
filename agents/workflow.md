# Orchestrator 워크플로우

## Tier 분류

| Tier | 기준 | 처리 방법 |
|------|------|-----------|
| 0 | 설정 1줄·Codex 적합 | Codex 명령어 제시 |
| 1 | 파일 1~3개·기계적 | Orchestrator 직접 처리 |
| 2 | 파일 4~10개 | Orchestrator 직접 처리 |
| 3 | 파일 11개+ OR 설계 필요 | 에이전트 스폰 |
| 4 | 외부 서비스 연동 + 설계 | 에이전트 스폰 |

---

## 이슈 착수 ~ 머지 체크리스트

```
[ ] 1. backlog.md 교차 확인 (이미 구현됨? 백로그 중복?)
[ ] 2. Tier 분류
[ ] 3. Git 브랜치 생성: feat/{issue-id}-{slug}
[ ] 4. backlog.md → 🔨 진행 중 + session.md 업데이트
[ ] 5. 구현 (Orchestrator 직접 or 에이전트 스폰)
[ ] 6. TypeScript 체크: npx tsc --noEmit
[ ] 6-A. 크로스플랫폼 확인: 새 UI 기능이 모바일·데스크톱 양쪽에 있는가
         → hidden sm:* / hidden lg:* 로 한쪽만 숨긴 경우 PR description에 이유 명시
[ ] 6-B. 텍스트 오버플로우 확인: flex item에 min-w-0 · truncate 적용 여부
         → 규칙 상세: docs/design-system.md ## 구현 규칙
[ ] 7. 커밋 + 푸시
[ ] 8. PR 생성 + 머지 (squash)
[ ] 9. main sync: git checkout main && git pull
```

---

## 머지 후 4-소스 문서 동기화 ← 반드시 완료

> PR 머지 후 아래 4개를 모두 완료해야 세션을 닫을 수 있다.
> 하나라도 누락 시 문서 드리프트 발생.

### ✅ 체크리스트

```
[ ] A. docs/backlog.md
      - 완료 항목 ✅ 상태 변경
      - 스프린트 섹션 헤더에 "✅ 전체 완료" 표시
      - 완료 이력 테이블에 행 추가 (날짜·PR 번호)

[ ] B. agents/session.md
      - 작업 현황 테이블 ✅ PR #n 머지됨으로 갱신
      - "다음 할 일" 업데이트
      - "마지막 커밋" sha + 메시지 갱신
      - (스프린트 완료 시) 완료 요약 섹션 추가

[ ] C. Obsidian 볼트 (C:\Users\zerom\Desktop\DevZero\omg\docs)
      - sprints/sprint-v{N}.md 생성 (구현 항목·DB 변경·신규 파일 기록)
      - roadmap.md 상태 갱신:
          - frontmatter updated: 날짜
          - 현재 상태 헤더 갱신
          - 해당 스프린트 섹션 [ ] → [x] + ✅ 표시

[ ] D. GitHub (https://github.com/KzeroM/omg)
      - 관련 이슈 닫기 (있을 경우)
      - 마일스톤 업데이트 (있을 경우)
      - (이슈가 없으면 생략)

[ ] E. Linear
      - 이슈 완료 처리
      - (API key 없으면 생략 — CEO가 수동 처리)
```

### 동기화 커밋 규칙

```
docs: v{N} 완료 처리 (PR #n) — session.md + backlog.md 동기화
```
- Obsidian은 로컬 파일이므로 별도 커밋 불필요
- session.md + backlog.md 변경은 main에 직접 push (feature branch 불필요)

---

## Prod 배포 체크리스트

```
[ ] 1. main에 모든 변경 push 완료
[ ] 2. Vercel 최신 배포 확인 (get_project → latestDeployment sha)
[ ] 3. latestDeployment sha ≠ main HEAD → 재트리거 필요
      → git -C {프로젝트} commit --allow-empty -m "chore: trigger vercel redeploy"
      → git -C {프로젝트} push origin main
[ ] 4. list_deployments로 새 READY 배포 확인
[ ] 5. 도메인: omg-iota.vercel.app 에서 실제 동작 확인
```

---

## 에이전트 스폰 프롬프트 필수 포함 항목

```
- 역할 파일: agents/roles/{role}.md 를 먼저 읽을 것
- 작업 ID: {issue-id}
- 핸드오프 저장 경로: agents/handoffs/{issue-id}/{role}.md
- 이전 핸드오프 요약: (이전 "다음 에이전트에게" 섹션)
- 프로젝트 경로: C:\Users\zerom\Desktop\DevZero\omg
- 브랜치: feat/{issue-id}-{slug}
- 리서치만 / 파일 수정까지 명시

⚠️ 파일 수정만 할 것. git commit / push / PR 생성 하지 말 것.
보고는 아래 형식만 (100단어 이내):
수정 파일: [목록]
완료 여부: ✅ / ❌ (이유 한 줄)
```

---

## 모델 선택

| 모델 | 사용 대상 |
|------|----------|
| `haiku` | PO, Designer, Dev, QA — 기계적 작업 |
| `sonnet` | PM, TechLead, Orchestrator — 판단·설계 |

---

## 파일 읽기 원칙

1. `Grep`으로 필요한 줄 번호 먼저 확인
2. `Read(offset=N, limit=40)` 으로 해당 구간만 읽기
3. 이미 컨텍스트에 있으면 Re-Read 금지
4. 예측 가능한 경로는 바로 `Read`

## 커밋 배치 원칙

- 연속 기계적 작업: 마지막에 1회 TypeScript 체크
- 독립적 소형 작업들: 1 커밋으로 묶기
- 커밋 단위: 배포 가능한 논리 단위

# Portfolio Demo Plan

`family-budget-web`는 실제 운영용 private repo다. 포트폴리오 공개는 `family-budget-demo` public repo로 분리한다.

## 목표

- 실제 가족 데이터 없이 제품 역량을 보여주는 public demo
- 회원가입/로그인 기반 multi-tenant SaaS 형태
- 포트폴리오 README/스크린샷/기술 설명 포함

## Public demo에 포함할 것

- Demo seed data
- Supabase Auth 또는 local mock auth
- Demo household 생성 플로우
- 모바일 first daily input
- Dashboard/ledger/settings 화면
- README, architecture diagram, screenshots
- CI build

## Public demo에서 제거할 것

- 실제 Google Sheet ID/스크립트
- 실제 Supabase/Postgres URL 또는 운영 env 이름
- PIN 인증 구조
- 가족 프로필명/운영자명/실거래명
- keepalive/Telegram/Hermes cron 운영 정보
- DB dump, CSV, screenshots with real data

## Demo seed data 기준

Demo data는 현실감은 있되 개인 식별성이 없어야 한다.

예시 카테고리:

- groceries
- transport
- healthcare
- housing
- subscriptions
- salary
- savings

예시 household:

- `demo-household-alpha`
- members: `Alex`, `Jamie`

## 단계

1. Public repo `family-budget-demo` 생성
2. Demo seed JSON/SQL 추가
3. README/architecture 문서 추가
4. 기존 UI를 demo data source에 맞춰 복제 또는 새로 scaffold
5. Supabase Auth 도입
6. Vercel demo deployment 생성
7. Screenshots/GIF 추가
8. private 운영 repo와 public demo repo sync 정책 문서화

## Sync 정책

- UI component 개선은 private → demo로 선별 port
- 운영 DB/import/cron/auth PIN 코드는 demo로 옮기지 않음
- demo repo에는 `demo` label/branding 명시

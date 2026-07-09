# Auth and Multi-tenant Plan

현재 운영 앱은 private family app이며 PIN 기반 접근 보호를 사용한다. 포트폴리오/demo 또는 SaaS형 확장 시에는 Supabase Auth + household tenancy로 전환한다.

## 권장 Auth

1차 추천: Supabase Auth

이유:

- 현재 운영 DB가 Supabase/Postgres 계열
- Next.js route handler와 연동이 단순
- email/password, magic link, OAuth 확장 가능
- row-level security 전환 경로가 명확

## 핵심 도메인 모델

```txt
users
households
household_members
profiles
transactions
purpose_deposits
asset_snapshots
recurring_items
settings
```

## Tenancy key

모든 사용자 데이터 테이블에 `household_id`를 둔다.

```sql
household_id uuid not null references households(id)
created_by uuid references auth.users(id)
```

필요하면 프로필 단위로 추가 분리한다.

```sql
profile_id uuid references profiles(id)
owner_type text
```

## 권한 모델

```txt
household_members.role
- owner
- editor
- viewer
```

권한:

- owner: household/settings/member 관리
- editor: 거래/자산/목적통장/반복항목 CRUD
- viewer: 읽기 전용

## Migration 단계

### Phase 1 — Auth shell

- Supabase Auth client/server helper 추가
- `/login`, `/signup`, `/logout` 구현
- PIN auth는 private 운영 branch에만 유지하거나 feature flag 처리

### Phase 2 — Household bootstrap

- 최초 가입 시 household 생성
- demo seed import 버튼 제공
- user profile 생성

### Phase 3 — Data isolation

- 모든 API route에서 session user 확인
- user가 속한 household만 query
- 기존 `BUDGET_ACTIVE_ORG_ID` fallback 제거 또는 demo-only 처리

### Phase 4 — RLS

- Supabase RLS enable
- household_members membership 기반 policy 추가
- service-role/server-only write 경로 최소화

### Phase 5 — Product polish

- invite link
- role management
- onboarding checklist
- empty states
- sample data reset

## API guard invariant

모든 private data API route는 다음을 만족해야 한다.

```txt
1. session user exists
2. household_id belongs to session user
3. requested profile_id belongs to household_id
4. writes preserve household_id/profile_id
```

## Demo mode

Public portfolio demo는 다음 둘 중 하나로 운영한다.

### Option A — Auth required demo

- 방문자 회원가입 가능
- 가입 시 sample household 자동 생성
- 실제 SaaS에 가까움

### Option B — read-only demo account

- demo 계정 자동 로그인 또는 public read-only session
- portfolio 관람이 빠름
- write action은 local-only/mock 처리

권장: A를 기본으로 하고 B를 스크린샷/영상으로 보완.

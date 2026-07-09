# Family Budget Demo

Public portfolio scaffold for a family budget web product.

This repository intentionally contains **demo-only data and planning docs**. The real operating app lives in a separate private repository.

## What this demo will show

- Mobile-first daily expense input
- Household dashboard
- Card-first transaction ledger
- Settings/source-of-truth management view
- Future Supabase Auth signup/login
- Future multi-tenant household isolation

## What is intentionally not included

- Real family finance data
- Real Google Sheet IDs
- Real Supabase/Postgres URLs or credentials
- PIN auth secrets
- Private operations scripts
- Production deployment topology

## Demo data

See:

```txt
demo/seed-data.json
```

## Productization plan

- `docs/portfolio-demo-plan.md`
- `docs/auth-multitenant-plan.md`

## Status

Scaffold only. Full public demo implementation will be built from this safe boundary.

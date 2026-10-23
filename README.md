# Family Budget Demo

Public, synthetic demonstration of a household budget application: daily entry, ledger review, recurring-plan reconciliation, and month-end checks.

## Public demo boundary

The operating product has a private backend. **This repository does not publish or connect to that backend.** Its public adapter reads and writes synthetic data in this browser's `localStorage`; API-shaped requests from the shared UI are handled locally, not sent to a financial server.

- The demo clock is fixed at **2026-08-13**, with August 2026 fixtures. Household labels, accounts, amounts, and transactions are synthetic.
- Reloading preserves local changes. Resetting restores the synthetic seed, including reconciliation state.
- This is a single-browser demonstration, not proof of shared-user collaboration, cross-device synchronization, concurrent-server writes, production authentication, or operational backend reliability. Do not enter private financial data.
- Real household data, credentials, private operational scripts, and deployment topology are excluded.

## Current routes

| Route | Screen |
| --- | --- |
| `/` | 오늘 입력: quick entry and recent transactions |
| `/dashboard` | Expected versus actual totals, monthly decision, and close checklist |
| `/ledger` | Editable transaction ledger |
| `/purpose` | Purpose-account deposits, usage, and balances |
| `/assets` | Monthly asset snapshots and household inclusion |
| `/recurring` | Recurring rules and monthly actual reconciliation |
| `/settings` | Synthetic input options |

A route without a month is normalized to `?month=2026-08`, so navigation and data use the same synthetic month. Use `?month=2026-08&owner=all` for a reproducible household-wide view. The UI is Korean-only. `/add` is a retained legacy form with a separate legacy demo store; it is not the current `/` entry flow or part of the reconciliation scenario below.

## Reproduce the reconciliation flow

Start with a reset and select August 2026 / all owners. Visit `/recurring` and use the monthly actual-status tab.

1. **Link salary, do not duplicate it.** The `급여` rule expects 4,200,000 won. Its existing August 10 transaction (`tx-2`) is a candidate. Link that record, then check `/ledger`: the original salary remains a single transaction.
2. **Realize an expense.** For `주거비`, confirm an August date and 1,200,000 won. The adapter creates a negative expense transaction and links it to that month's occurrence. Repeating the same realization must not create another expense. A different actual amount is shown as a variance, not silently treated as an exact match.
3. **Link savings to its existing deposit.** For `여행 저축`, link the August 5 purpose-account deposit (`purpose-1`, 500,000 won). Check `/purpose`: linking does not add another deposit or count savings as income.
4. **Reopen without erasing history.** Reopen a linked occurrence. Its original transaction or deposit remains in `/ledger` or `/purpose`; only the monthly reconciliation link is cleared. Link that existing record again instead of creating a duplicate. Skip marks that month's occurrence as skipped; reopen makes it available for reconciliation again.
5. **Inspect month-end warnings.** In `/ledger`, mark an entry `확인 필요`. Alternatively, increase the `여행 숙소` purpose-account expense to 880,000 won: against the 500,000 won deposit this leaves a **−380,000 won** travel balance. `/dashboard` must show `확인 필요`, not `마감 가능`. Unresolved reconciliation and missing monthly purpose/asset inputs also prevent a clean close; a negative planned surplus calls for `줄이기 필요` once outstanding checks are resolved. A close-ready badge is a derived review status, not a server-side accounting lock.
6. **Reset.** In the browser developer console on the demo origin, run:

   ```js
   localStorage.removeItem('family-budget-demo:v4');
   location.reload();
   ```

   This clears the current synthetic store and restores seed rows and pending occurrences. It does not touch the private operating product or the separate legacy demo store.

## Source and UI provenance

- [`packages/budget-ui`](packages/budget-ui) is the canonical UI snapshot shared with the operating product, not a separately redrawn public UI.
- [`ssot/exact-source-manifest.json`](ssot/exact-source-manifest.json) pins canonical source provenance and the permitted extraction seams. [`scripts/verify-ssot.mjs`](scripts/verify-ssot.mjs) checks that boundary.
- [`components/DemoShell.tsx`](components/DemoShell.tsx) injects the fixed clock, synthetic read provider, and local command adapter through the package runtime contract.
- [`components/BudgetRoute.tsx`](components/BudgetRoute.tsx) composes the public routes. [`lib/synthetic-budget.ts`](lib/synthetic-budget.ts) owns fixtures, browser persistence, monthly occurrences, candidate linking, realization, and derived dashboard inputs.
- [`lib/synthetic-budget.test.ts`](lib/synthetic-budget.test.ts) contains adapter regression coverage. Public source/runtime boundary checks live in [`scripts`](scripts).

The public adapter exercises local domain behavior. It does not establish production write approval, network read-back, partial network-failure recovery, or multi-user guarantees.

## Development

Requires Node.js 20 or newer. Stack: Next.js App Router, React, TypeScript, Tailwind CSS, HeroUI, and Vitest / Testing Library.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Available checks (no fixed passing-test count is claimed here):

```bash
npm test
npm run verify:ssot
npm run scan:public-boundary
npm run check:public-ssot
npm run check:package-runtime
npm run build
npm run check:production-css
```

Use `npm run test:watch` for watch mode and `npm start` to serve a production build. Check results apply to the revision and environment in which they were run, not automatically to a later deployment.

## Published demo

[family-budget-demo-three.vercel.app](https://family-budget-demo-three.vercel.app) is the public demo URL. The deployed revision can differ from a local checkout; use the source and revision-specific CI evidence when reviewing implementation claims.

## License and author

This is a public portfolio demonstration project by Hyeonjun Gil (kilhyeonjun).

Portfolio: [kilpenguin.com](https://kilpenguin.com)

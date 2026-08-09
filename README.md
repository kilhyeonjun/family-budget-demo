# Family Budget Demo

Public portfolio demo of a family budget management web application.

## 🎯 Purpose

This repository demonstrates a mobile-first family budget tracking system with:
- **Dashboard** with income/expense summary and recent transactions
- **Ledger** showing complete transaction history
- **Add Transaction** form for recording new income/expenses
- **Browser-local persistence** so submitted synthetic entries appear on Dashboard and Ledger
- **Reset demo** control that restores the tracked synthetic seed
- Demo data for portfolio presentation (no real family data)

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + HeroUI 3
- **Testing**: Vitest + Testing Library
- **Data**: JSON seed data (demo mode)

## 📦 Installation

```bash
npm install
```

## 🏃 Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## 🏗️ Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard (/)
│   ├── add/page.tsx       # Add Transaction (/add)
│   ├── ledger/page.tsx    # Transaction Ledger (/ledger)
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── DashboardView.tsx
│   ├── LedgerView.tsx
│   └── AddTransactionForm.tsx
├── lib/                   # Business logic
│   ├── types.ts          # TypeScript types
│   ├── budget-service.ts # Budget calculations
│   └── data-loader.ts    # Seed data loader
├── demo/                  # Demo seed data
│   └── seed-data.json
└── docs/                  # Planning documents
    ├── portfolio-demo-plan.md
    └── auth-multitenant-plan.md
```

## 🎨 Features

### Dashboard
- Monthly income/expense/balance summary
- Recent transactions preview
- Quick navigation to add transaction and ledger

### Ledger
- Complete transaction history
- Sorted by date (newest first)
- Category, owner, and amount display

### Add Transaction
- Form for recording new transactions
- Income/Expense type selection
- Category and owner assignment
- Date picker
- Saves only to this browser's local storage; no network write or production database

## 🔒 What's NOT Included

This is a **demo-only** repository. The following are intentionally excluded:

- Real family financial data
- Production database credentials
- Google Sheets integration details
- PIN authentication secrets
- Private operational scripts
- Production deployment topology

## 📝 Testing Strategy

Built with **Test-Driven Development (TDD)**:
- ✅ 26 passing tests across 6 test suites
- ✅ Service layer unit tests
- ✅ Component rendering tests
- ✅ User interaction tests
- ✅ Data loading tests

## 🚢 Deployment

The repository is deployment-ready for Vercel. Public Production URL remains unverified until provider deployment evidence and live browser read-back are available.

## 📄 License

This is a public portfolio demonstration project.

## 👤 Author

Hyeonjun Gil (kilhyeonjun)

Portfolio: [kilpenguin.com](https://kilpenguin.com)

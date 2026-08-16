<!-- Finora -->
# Finora — Personal Finance Dashboard

A modern, production-quality personal finance dashboard for tracking income, expenses, budgets, savings goals and recurring transactions — built with React, TypeScript and Tailwind CSS.

Finora runs entirely in the browser. Every visit is protected by a secret number, every figure on screen is calculated from your real transaction data, and everything is stored locally in your browser. No backend, no account, no tracking.

## Live Demo

🌐 [deepankar-siddharth.github.io/finora](https://deepankar-siddharth.github.io/finora/)

The live site is built from the `main` branch and deployed to GitHub Pages. Every visitor must enter the site's secret number to open the app. You start with an empty dashboard and add your real transactions from scratch (or import them from CSV).

## Features

- **Dashboard** — a financial overview with total balance, income, expenses and savings, plus a month selector, spending chart (week / month / year), expense breakdown donut, budget and savings-goal widgets.
- **Transactions** — full CRUD with search, date-range / category / type / payment-method filters, sorting, validation and a responsive table (cards on mobile).
- **Budgets** — monthly limits per category with live usage, remaining amounts and warnings at 75%, 90% and when exceeded.
- **Savings Goals** — set a target, track progress, and see the most relevant goal on the dashboard.
- **Analytics** — income, expense and savings trends over 12 months, category analysis, savings rate and an estimated financial-health score (clearly labelled as informational, not advice).
- **Recurring Transactions** — daily, weekly, monthly or yearly schedules. Generate an occurrence to create a real transaction and advance the next date automatically.
- **Global Search** — command-style search (Ctrl+K) across descriptions, categories, payment methods and notes, with keyboard navigation.
- **Data Controls** — export transactions to CSV, import a previously exported CSV with per-row validation, and reset all data (with typed confirmation).
- **Secret-number gate** — a static 4–6 digit secret (stored in `src/site.config.ts` in this repo) is required on every visit, so the same number works from any device. A 5-attempt cooling period blocks guessing.
- **Themes** — light, dark and system mode with no flash of the wrong theme on load.
- **Local Persistence** — everything is saved to `localStorage`; you start with an empty dashboard and build up your own real data.
- **Fully Responsive** — desktop, tablet and mobile layouts with an accessible mobile drawer navigation.

## Screenshots

| Light mode | Dark mode | Mobile |
| --- | --- | --- |
| *Coming soon* | *Coming soon* | *Coming soon* |

> Add your own screenshots here — for example:
>
> ```bash
> # start the app, then capture:
> npm run dev
> ```

## Tech Stack

- [React 19](https://react.dev)
- [Vite 8](https://vite.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Recharts 3](https://recharts.org) — charts
- [Lucide React](https://lucide.dev) — icons
- [React Router 7](https://reactrouter.com) — client-side routing (`HashRouter`)
- [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — persistence

## Getting Started

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). Every visit asks for the site secret number (defined in `src/site.config.ts`), then opens an empty dashboard — add your real transactions from scratch or use **Settings → Data → Import CSV** to load them from a file.

## Development

```bash
npm run dev       # start the dev server with hot reload
npm run lint      # run oxlint
npm run build     # type-check and build for production
npm run preview   # serve the production build locally
```

## Production Build

```bash
npm run build
```

The output is written to `dist/`. The Vite `base` is set to `'./'` and routing uses `HashRouter`, so the build can be served from any static path.

## Deployment

### GitHub Pages

The repository includes `.github/workflows/deploy.yml`, which builds and publishes the app to GitHub Pages on every push to `main`.

1. Push this project to a GitHub repository named `finora`.
2. Go to **Settings → Pages** in the repository.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Push to `main` — the workflow builds `dist/` and deploys it to `https://<your-username>.github.io/finora/`.

You can also deploy the static files yourself:

```bash
npm run build
# upload the contents of dist/ to any static host or the gh-pages branch
```

## Data Privacy

Finora is a local-first application. Your financial data is stored **only** in your browser's `localStorage` under keys prefixed with `finora_` (for example `finora_transactions`). The site secret is a fixed value in `src/site.config.ts` — anyone who inspects the published code could find it, so use it only as a casual personal gate, not for anything that needs real security. Nothing is ever uploaded, transmitted or sold — there is no backend and no analytics. Clearing your browser data removes Finora's data; use **Settings → Data → Export CSV** first if you want a backup.

## Project Structure

```text
src/
├── components/
│   ├── ui/           # Button, Card, Modal, Badge, ProgressBar, ...
│   ├── layout/       # AppShell, Sidebar, Header, GlobalSearch
│   ├── dashboard/    # SummaryCards, SpendingChart, ExpenseBreakdown, ...
│   ├── transactions/ # TransactionFormModal, TransactionTable, Filters
│   ├── budgets/      # BudgetCard, BudgetFormModal
│   ├── goals/        # GoalCard, GoalFormModal
│   ├── recurring/    # RecurringCard, RecurringFormModal
│   ├── analytics/    # HealthScoreCard, TrendChart, CategorySpending, ...
│   └── settings/     # Profile, Appearance, Data sections
├── auth/             # AuthGate, UnlockScreen, PinField
├── pages/            # Dashboard, Transactions, Budgets, Analytics, Recurring, Settings
├── context/          # Finance context + provider, ToastContext
├── services/         # storage.ts (localStorage layer)
├── types/            # domain types + filter types
├── utils/            # currency, dates, transactions, budgets, analytics, csv, pin
├── constants/        # categories, nav, currencies
├── App.tsx
└── main.tsx
```

Financial calculations (balance, income, expenses, savings rate, budget usage, health score, CSV) are centralized in `src/utils` so the same underlying data produces consistent values everywhere.

## Future Improvements

- Multiple accounts and account transfer support.
- Bill reminders and notifications for upcoming recurring transactions.
- More granular recurring rules (e.g. every 2 weeks, weekday schedules).
- CSV import mapping UI for arbitrary bank export formats.
- Optional end-to-end encryption for local backups.
- PWA installation with offline support.
- Currency conversion for multi-currency portfolios.

## License

[MIT](./LICENSE)

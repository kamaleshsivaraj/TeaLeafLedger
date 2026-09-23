# TeaLeafLedger

Collection Centre Management System — a production-grade, full-stack application that runs the weighing-counter desk at a green-leaf tea buying centre: suppliers bring leaf bags, get weighed, taxed and paid, and the centre tracks rates, advances/payments, factory deliveries and reports.

---

## Author

| | |
|---|---|
| **Name** | Kamalesh Sivaraj |
| **Email** | [kamaleshsivaraj@outlook.com](mailto:kamaleshsivaraj@outlook.com) |
| **Website** | [https://kamaleshsivaraj.dev](https://kamaleshsivaraj.vercel.app) |

---

## Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Workflow](#workflow)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Testing](#testing)
- [License](#license)

---

## About the Project

TeaLeafLedger digitises the end-to-end operations of a tea leaf collection centre. It replaces paper weighment slips and manual passbooks with a real-time process: a clerk finds the supplier, records bag weights, the system computes gross/net weight, applies the day's per-grade rate and tax, recovers advances, and prints a receipt on the spot — while the owner gets live rates, factory reconciliation and settlement reports.

The repository is organised in `v1/`, which contains the Spring Boot backend, the React frontend and the Playwright E2E test suite.

---

## Features

### Authentication & Security
- JWT-based sign in / sign up (PUBLIC + protected routes)
- **Public landing page** (`/landing`) — modern marketing site with Home, Features, About, Pricing and CTA sections
- Two-step forgot / reset password via email OTP (real Gmail SMTP with demo-code fallback)
- Change password guarded by an email OTP
- Email verification (OTP via Gmail SMTP or demo code)
- Phone verification (manual supervision mode / pluggable Fast2SMS)
- Google Authenticator 2FA (QR setup, enable / disable)
- Role-based access control with a per-module, per-action permission matrix

### User Management (admin-only)
- Create, edit and delete users
- Roles: ADMIN, MANAGER, OPERATOR, ACCOUNTANT
- Toggle module permissions per role (privileges matrix)

### Daily Collection — the core workflow
- Live supplier search (name, code, phone or division)
- Bag count and per-bag weights with auto tare calculation
- Automatic gross → net leaf weight + grade-wise rate
- Tax modes: none / intra-state (CGST + SGST) / inter-state (IGST)
- Automatic advance recovery (capped)
- POS-style printable receipt, with or without amount
- Saved-collections list, edit and delete with confirmation modal

### Farmers
- Full supplier CRUD from a supplier registry
- Status (Active / Inactive), division filters and search
- Delete confirmation modal

### Rate Management
- Per-grade leaf rates (Standard / Premium / Rejected)
- Effective-from dates and active toggle
- Restore sample rates + delete confirmation modal

### Payments & Advances
- Record / edit advances and payments
- Transaction ledger with search and type filter
- Outstanding-balance summary
- Delete confirmation modal

### Factory Deliveries
- Dispatch records with sent vs. factory-weight variance
- Reconciliation status pill
- Delete confirmation modal

### Reports (all printable with a branded A4 template)
- Daily collection summary
- Supplier passbook
- Factory reconciliation
- Weekly payment sheet
- Print templates include the app logo header, summary stat cards and data tables

### Dashboard & Day Status
- Overview stats
- Operational day status: Open → Half day → Closed → Week off

### Automation & Testing
- Playwright E2E workflow suite (self-contained CRUD runs per module)
- Frontend unit tests (Vitest + Testing Library)
- Backend unit + integration tests (JUnit, MockMvc)

---

## Workflow

```
Auth (JWT) → Dashboard → Farmers (CRUD)
                ↓
         Daily Collection (6 steps):
           1. Find Supplier
           2. Enter Bags (count + per-bag weights)
           3. Tare Calculation (auto)
           4. Weigh Leaf (gross → net + grade)
           5. Apply Tax / Advance Recovery
           6. Issue Printable Receipt
                ↓
         Rate Management (per-grade, effective dates)
                ↓
         Payments & Advances (ledger + advance recovery)
                ↓
         Factory Deliveries (weight reconciliation)
                ↓
         Reports (collection, passbook, factory, payments)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TailwindCSS + Vite (port 5183) |
| Backend | Java 17 + Spring Boot 3.2 + Maven (port 8090) |
| Primary DB | PostgreSQL |
| Secondary DB | MongoDB (seed / reference data) |
| Auth | JWT (jjwt) + Spring Security |
| Testing | Playwright, Vitest, JUnit + MockMvc |

---

## Project Structure

```
TeaLeafLedger/
├── README.md                 # You are here
├── TASK_PLAN.md              # Implementation plan for test & print work
├── LICENSE
└── v1/
    ├── README.md             # Full app guide (setup, APIs, structure)
    ├── testTodo.md           # Test coverage status & history
    ├── backend/              # Spring Boot API
    ├── frontend/             # React + Vite app
    ├── e2e/                  # Playwright E2E suite
    ├── playwright-results/   # E2E output (HTML report, videos, screenshots)
    └── *.sh                  # start / test helper scripts
```

---

## Getting Started

Full setup instructions (prerequisites, PostgreSQL/MongoDB setup, running backend + frontend, API endpoints) are documented in **[`v1/README.md`](v1/README.md)**.

Quick start:

```bash
# Backend (from v1/)
cd v1/backend && mvn spring-boot:run          # runs on :8090

# Frontend (from v1/)
cd v1/frontend && npm install && npm run dev  # runs on :5183
```

---

## Documentation

| Document | Path | Purpose |
|----------|------|---------|
| **Project README (this file)** | [`README.md`](README.md) | Overview, features, workflows |
| **Application guide** | [`v1/README.md`](v1/README.md) | Tech stack, structure, DB setup, run instructions, API endpoints, workflow diagram |
| **Implementation plan** | [`TASK_PLAN.md`](TASK_PLAN.md) | Plan for the Playwright specs, report print templates and delete-confirmation modals |
| **Test coverage status** | [`v1/testTodo.md`](v1/testTodo.md) | E2E / unit / backend test results, bugs found & fixed |

---

## Testing

E2E (needs Postgres up, seed data imported, and both servers running):

```bash
cd v1/e2e && npx playwright test --project=chrome
```

Backend unit + integration tests:

```bash
cd v1/backend && set -a; source ../.env; set +a; mvn test
```

Frontend unit tests:

```bash
cd v1/frontend && npm test
```

View the Playwright HTML report:

```bash
start v1/playwright-results/html-report/index.html
```

Coverage details and known residual data are tracked in **[`v1/testTodo.md`](v1/testTodo.md)**.

---

## License

Licensed under the **Apache License 2.0** — Copyright © 2026 **Kamalesh Sivaraj** — [kamaleshsivaraj@outlook.com](mailto:kamaleshsivaraj@outlook.com) — [https://kamaleshsivaraj.dev](https://kamaleshsivaraj.dev)

See [`LICENSE`](LICENSE) for the full text. Contributor License Agreements for individual and corporate contributors live in [`CLA/`](CLA/).

---

## Support & Donate

TeaLeafLedger is free and open source (Apache-2.0). If it saves you time or money, consider supporting development:

- **Open Collective** — [donate](https://opencollective.com/tealeafledger) (one-time or recurring)
- **GitHub Sponsors** — [sponsor](https://github.com/sponsors/KamaleshSivaraj)

Donations fund ongoing maintenance, new features and infrastructure. Thanks for your support!
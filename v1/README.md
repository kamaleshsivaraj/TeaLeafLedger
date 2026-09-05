# TeaLeafLedger v1

Tea Collection Centre Management System — Production-grade full-stack application.

## About Project
A tea leaf collection-centre management system — a full-stack app that runs the weighing-counter desk at a green-leaf buying centre: suppliers (farmers) bring leaf bags, get weighed, taxed, and paid, and the centre tracks rates, advances/payments, factory deliveries, and reports.
Tech stack
Layer	Tech
Frontend	React 18 + TailwindCSS + Vite (port 5183)
Backend	Java Spring Boot 3.2 + Maven (port 8090)
Primary DB	PostgreSQL (tealeafledger)
Secondary DB	MongoDB (tealeafledger_seed, seed/reference data)
Auth	JWT + Spring Security
Main modules
- Dashboard — overview stats
- Daily collection — the core workflow: find supplier → enter bags → bag/tare maths → auto gross/net weight → grade-wise rate → tax (CGST/SGST/IGST) → advance recovery → printable receipt
- Farmers — supplier CRUD
- Factory deliveries — dispatch records
- Rate management — active per-grade leaf rates
- Payments & advances — financial ledger, advance recovery logic
- Reports — collection summary, factory reconciliation, supplier passbook, payment sheets
- Account & Security — profile, change password w/ OTP, email & phone verification, 2FA (Google Authenticator)
Recent additions (built over our sessions)
- Verification & OTP: Gmail SMTP email codes (real + demo fallback), forgot/reset password via email OTP, change-password guarded by OTP, phone verification (manual mode or pluggable Fast2SMS)
- User Management (admin-only): search/filter, create/edit/delete users, roles ADMIN / MANAGER / OPERATOR / ACCOUNTANT
- Notifications, dark/light theme, collection edit/delete, print with/without amount, and now the POS receipt print + editable email
Workflow chain
Auth (JWT) → Dashboard → Farmers → Daily Collection (6 steps) → Rates → Payments/Advances → Factory Deliveries → Reports


1)in sidebar the collection day open green light is showing know i want that a small section for only let it be closed/opened/halfday/weekoff kind i want 
2)create Roles & permissions Define what each role can do across modules and buttons. Permissions gate who can access the button like read, write, view.
3)create a module Privileges Roles & tab access
The ADMIN super-role always has full access and cannot be modified. Decide which roles can access the modules



## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TailwindCSS + Vite |
| Backend | Java Spring Boot 3.2 |
| Primary DB | PostgreSQL |
| Secondary DB | MongoDB (seed/reference data) |
| Auth | JWT + Spring Security |

## Project Structure

```
v1/
├── backend/                    # Spring Boot API
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/tealeafledger/
│       │   ├── entity/         # JPA entities (8 tables)
│       │   ├── repository/     # Spring Data JPA repos
│       │   ├── service/        # Business logic
│       │   ├── controller/     # REST endpoints
│       │   ├── config/         # Security, JWT, MongoDB seeder
│       │   ├── dto/            # Request/Response DTOs
│       │   └── exception/      # Global error handling
│       └── resources/
│           ├── application.yml
│           └── mongo-seed/     # MongoDB seed JSON files
├── frontend/                   # React + TailwindCSS
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api/                # Axios API client
│       ├── context/            # Auth context
│       ├── components/         # Layout, Sidebar, Topbar
│       └── pages/              # All page components
├── import-seed-data.sh         # MongoDB seed import script
└── import-seed-data.bat        # Windows seed import script
```

## Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+
- PostgreSQL 14+
- MongoDB 6+

## Database Setup

### PostgreSQL

```sql
CREATE DATABASE tealeafledger;
```

### MongoDB

```bash
# Import seed data
./import-seed-data.sh
# or on Windows:
import-seed-data.bat
```

## Running the Application

### Backend

```bash
cd backend
mvn spring-boot:run
```

API runs on `http://localhost:8090`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5183`

## API Endpoints

### Authentication
- `POST /api/auth/signup` — Create account
- `POST /api/auth/login` — Login

### Farmers
- `GET /api/farmers` — List all farmers
- `GET /api/farmers/:id` — Get farmer
- `POST /api/farmers` — Create farmer
- `PUT /api/farmers/:id` — Update farmer
- `DELETE /api/farmers/:id` — Delete farmer

### Collections
- `GET /api/collections` — List all
- `POST /api/collections` — Create collection
- `GET /api/collections/range?from=&to=` — Date range
- `GET /api/collections/farmer/:id` — By farmer

### Rates
- `GET /api/rates` — List all rates
- `POST /api/rates` — Create rate
- `PUT /api/rates/:id` — Update rate
- `DELETE /api/rates/:id` — Delete rate
- `GET /api/rates/active/:grade` — Active rate for grade

### Finance
- `GET /api/finance/summary` — Financial summary
- `GET /api/finance/ledger` — Transaction ledger
- `POST /api/finance/advances` — Record advance
- `POST /api/finance/payments` — Record payment

### Deliveries
- `GET /api/deliveries` — List all
- `POST /api/deliveries` — Create delivery
- `PUT /api/deliveries/:id` — Update delivery
- `DELETE /api/deliveries/:id` — Delete delivery

### Reports
- `GET /api/reports/collection?from=&to=` — Collection summary
- `GET /api/reports/factory?from=&to=` — Factory reconciliation
- `GET /api/reports/passbook/:farmerId` — Supplier passbook
- `GET /api/reports/payments?from=&to=` — Weekly payment sheet

## Workflow

```
Auth (JWT) → Dashboard → Farmers (CRUD)
                ↓
         Daily Collection:
           1. Find Supplier
           2. Enter Bags
           3. Tare Calculation
           4. Weigh Leaf
           5. Rate Application
           6. Receipt
                ↓
         Rate Management (grade-wise)
                ↓
         Payments & Advances
                ↓
         Factory Deliveries
                ↓
         Reports
```

## License

MIT License © 2026 Kamalesh Sivaraj

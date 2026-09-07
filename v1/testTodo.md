# Test TODO — TeaLeafLedger v1

Status of the automated test coverage for the reported bugs:

> "The save button is not working" (Payments & advances — edit) and
> "dropdown select and save is not working" (day status / farmers status
> dropdown + privileges save).

## How to run everything

Prerequisites: Postgres up, seed data imported, and the two servers running
(Vite on :5183 proxying /api to the Spring Boot backend on :8090).

```bash
# Full workflow E2E suite (needs both servers up)
cd v1/e2e && npx playwright test --project=chrome

# Backend unit + integration tests (needs Postgres + .env vars)
cd v1/backend && set -a; source ../.env; set +a; mvn test

# Frontend unit tests (jsdom, no servers needed)
cd v1/frontend && npm test
```

## Results (last green run)

| Suite                      | Location                         | Count  | Status |
| -------------------------- | -------------------------------- | ------ | ------ |
| E2E workflow specs         | `v1/e2e/specs/workflows/`        | 13/13  | pass   |
| Backend tests              | `v1/backend/src/test/`           | 23/23  | pass   |
| Frontend unit tests        | `v1/frontend/src/**/__tests__/`  | 9/9    | pass   |

## Real bugs found and fixed along the way

1. **Farmers status enum mismatch** — `Farmers.jsx` sent lowercase
   `status` (`active`/`inactive`); Jackson enum deserialization returned
   HTTP 500 and the "Save" appeared dead. Fixed by using the uppercase
   enum values (`ACTIVE`/`INACTIVE`) in the form default, `openAdd` and the
   `<option>` values. Covered by `Farmers.test.jsx` (default `ACTIVE` and
   `INACTIVE` after change).

2. **401 redirect wiped the login-error toast** — the axios response
   interceptor redirected to `/login` for every 401, including a failed
   `POST /api/auth/login`, so the "Invalid email or password" toast never
   showed. Fixed in `client.js` by skipping the redirect for `/auth/`
   URLs (`isAuthPath`). Covered by the `auth.spec.js` wrong-password test.

3. **Finance ledger edit never saved (the original bug)** — the ledger API
   did not return `farmerId`, so the "Edit advance" modal always failed its
   farmer lookup and bailed before sending the PUT. Fixed in
   `FinanceService.getLedger()` to include `farmerId` for advances and
   payments.

4. **Edit wiped the supplier name** — `updateAdvance`/`updatePayment`
   overwrote the stored `farmer`/`code` columns with the frontend PUT
   payload, which only sends `farmerId`, leaving orphaned blank rows in the
   ledger. Fixed by re-resolving the farmer from `farmerId` on update.
   Covered by the `finance.spec.js` workflow.

## E2E workflow specs (13 tests)

`v1/e2e/specs/workflows/` — one self-contained CRUD run per module. Every
spec logs in, seeds unique `uid()`-suffixed data, exercises the UI, then
deletes its own leftovers so repeats are safe. Shared login/uid helpers in
`_helpers.js`.

- `auth.spec.js` (4) — login page fields; wrong-password toast; manager
  redirected away from `/privileges`; accountant module visibility.
- `farmers.spec.js` — add → edit → delete a farmer (status dropdown).
- `rates.spec.js` — add → edit → delete a rate.
- `deliveries.spec.js` — add → edit → delete a delivery.
- `finance.spec.js` — advance → edit (amount 500 → 600) → payment → delete.
- `collection.spec.js` — weigh 2×5kg bags, verify live `net 8.0 kg`,
  grade dropdown, save, edit, delete.
- `users.spec.js` — add → edit → delete a user (role dropdown).
- `day-status.spec.js` — open → half day → closed → week off → open
  (the dropdown under test).
- `privileges.spec.js` (2) — manager blocked from the matrix; ADMIN toggle
  + save + revert (net-zero matrix, `toBeChecked()` / `not.toBeChecked()`).

Run notes (stable since these were added):
- Ledger rows after an update are re-read after a `page.reload()`, since the
  in-memory ledger can lag the PUT.
- Stacked identical toasts are asserted with `.last()`.
- The collection search is a client-side filter over farmers fetched on
  mount; the spec retries once after a reload if the list came back empty.

## Backend tests (23)

Integration (`@SpringBootTest` + MockMvc, real Postgres):
- `DayStatusControllerTest` — 403 unauthenticated; valid status with a
  manager token; PUT save + restore to `OPEN`; invalid status → 400.
- `PermissionControllerTest` — 403 unauthenticated for `/modules` and
  matrix; modules/actions + matrix with a token; unknown role → 400;
  non-admin PUT → 403.

Unit (Mockito, no DB):
- `DayStatusServiceTest` — newest row wins; creates `OPEN`/`system` seed;
  update mutates the row; history respects the limit.
- `PermissionServiceTest` — ADMIN has everything; null user → empty;
  OPERATOR defaults lock FINANCE/deliveries; stored JSON overrides
  defaults and drops unknown modules; save cleans unknown actions; ADMIN /
  null role rejected.

## Frontend unit tests (9)

Vitest + jsdom + Testing Library:

- `Privileges.test.jsx` (3) — tabs render and Save is disabled until a
  checkbox changes; toggle enables Save and POSTs the matrix for the active
  role; role switch saves to the selected role.
- `DayStatus.test.jsx` (3) — shows current status; dropdown change calls
  `updateDayStatus('HALFDAY')` and updates the label; non-ADMIN/MANAGER has
  no change control.
- `Farmers.test.jsx` (3) — add-farmer modal defaults status `ACTIVE` and
  `create` is called with the uppercase enum; switching to Inactive sends
  `INACTIVE`; the status dropdown exposes only `ACTIVE`/`INACTIVE`.

## Known residual data

Seed rows from earlier manual testing may persist in Postgres
(e.g. `S. Perera`/`TF-1045`, `K. Suresh`/`TF-1042`, `R. Arul`/`TF-1044`,
`P. Nadeesha`/`TF-1043`, `A. Kumar`/`TF-10463`, `Test`/`TF-1047`,
collection rows for those farmers). The automated suites never depend on
them and clean up their own data.
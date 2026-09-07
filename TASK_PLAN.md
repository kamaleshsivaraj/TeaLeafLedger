# TeaLeafLedger — Task Plan & Implementation Guide

## Overview

Seven tasks across Playwright E2E tests, Reports print template, and delete confirmation modals.

**Estimated time: ~5–5.5 hours total**

| Task | Description | Est. Time |
|------|-------------|-----------|
| 1+3 | Signup spec (`auth-signup.spec.js`) | 30 min |
| 2 | Reset password spec + forgot-password link | 30 min |
| 4 | Collection print button test | 15 min |
| 5 | Reports print template (portal-based) | 1.5–2 hrs |
| 6 | Email verification spec | 20 min |
| 7 | Delete confirmation modals (Farmers, Deliveries, Rates, Finance) | 1.5 hrs |

---

## Task 1+3: Signup Spec — `v1/e2e/specs/workflows/auth-signup.spec.js`

**Combined into one file covering page renders, valid signup, invalid signup errors, and form validation.**

### Tests

1. **Signup page renders all fields**
   - Navigate to `/signup`
   - Assert `h1` contains "TeaLeafLedger"
   - Assert full name input (placeholder "Your name")
   - Assert email input (`input[type="email"]`)
   - Assert phone input (`input[type="tel"]`)
   - Assert password input (minLength 8)
   - Assert confirm password input
   - Assert "Create account →" submit button
   - Assert "Already have an account? Login" link

2. **Valid signup creates account and redirects to dashboard**
   - Generate unique email: `testuser_${uid()}@test.com`
   - Fill all fields: name, email, phone, password (`TestPass@123`), confirm
   - Submit
   - Assert toast "Account created successfully!"
   - Assert URL is `/` (dashboard)

3. **Password mismatch shows error toast**
   - Fill email, password = `TestPass@123`, confirm = `DifferentPass`
   - Submit
   - Assert toast "Passwords do not match"

4. **Short password (< 8 chars) blocked by HTML validation**
   - Fill password with 5 chars
   - Assert `minLength` attribute is `8`

5. **Missing required fields blocked by HTML validation**
   - Submit without filling email
   - Assert `required` attribute on email, name, password, confirm fields

6. **Login link navigates to /login**
   - Click "Login" link
   - Assert URL is `/login`

---

## Task 2: Reset Password + Forgot Password Link

### File 1: `v1/e2e/specs/workflows/auth-reset.spec.js`

**Full forgot-password → reset flow.**

1. **Forgot password page renders email step**
   - Navigate to `/forgot-password`
   - Assert heading "Forgot password?"
   - Assert email input
   - Assert "Send reset code" button
   - Assert "Back to sign in" link

2. **Send reset code advances to reset step**
   - Enter `admin@tealeafledger.com`
   - Click "Send reset code"
   - Assert step 2 appears: "Enter reset code" heading
   - Assert 6-digit code input, new password input, confirm password input
   - Assert "Reset password" button

3. **Full reset flow with demoCode**
   - Enter email → click "Send reset code"
   - Intercept API response to capture `demoCode`
   - Fill code (from demoCode), new password `NewPass@123`, confirm `NewPass@123`
   - Click "Reset password"
   - Assert toast "Password reset — sign in with your new password"
   - Assert URL is `/login`

4. **Password mismatch during reset shows error**
   - Advance to reset step
   - Fill code, password = `Pass@1234`, confirm = `Different`
   - Submit
   - Assert toast "Passwords do not match"

5. **Wrong reset code shows error**
   - Advance to reset step
   - Fill wrong code `999999`, valid passwords
   - Submit
   - Assert error toast

6. **Change email link returns to email step**
   - On reset step, click "← Change email"
   - Assert email input is visible again

7. **Back to sign in navigates to /login**
   - Click "Back to sign in"
   - Assert URL is `/login`

### File 2: Add to `v1/e2e/specs/workflows/auth.spec.js`

**Add one test inside the existing `Sign in` describe block:**

8. **"Forgot password?" link navigates to /forgot-password**
   - On `/login`, assert "Forgot password?" link is visible
   - Click it
   - Assert URL is `/forgot-password`
   - Assert "Forgot password?" heading is visible

---

## Task 4: Collection Print Button Test — Edit `collection.spec.js`

**Replace the TODO comment at line 80 with actual print button verification.**

### Implementation

After the receipt panel assertion (line 78), add:

```js
// ---- VERIFY print buttons --------------------------------------------------
// Click "Print" — triggers window.print(); the global dialog handler accepts it
const printBtn = page.locator('.receipt-panel button', { hasText: 'Print' }).first();
await printBtn.click();
// Small wait for the print-receipt CSS class to be applied and window.print() to fire
await page.waitForTimeout(500);

// Click "Print w/o amount"
const printNoAmtBtn = page.locator('.receipt-panel button', { hasText: 'Print w/o amount' });
await printNoAmtBtn.click();
await page.waitForTimeout(500);
```

**Key points:**
- The existing `page.on('dialog', (d) => d.accept())` at line 26 handles `window.confirm()` but NOT the browser print dialog. Playwright's `window.print()` in headless mode is a no-op (it doesn't create a dialog). In headed mode it opens a native print dialog which Playwright can't intercept.
- The test should simply click both buttons and verify no JS errors occur. The `page.waitForTimeout(500)` ensures the print CSS class injection and cleanup cycle completes.
- If Playwright is running headed, the print dialog will appear and the user needs to close it. For CI (headless), `window.print()` is silently ignored.

---

## Task 5: Reports Print Template — Portal-Based

**The most complex task. Transform `window.print()` into a proper portal-based print system with styled templates for all 4 report types.**

### Approach

Mirror the Collection.jsx pattern:
1. Add a `<div id="print-root" />` in Reports.jsx
2. Create a `printReport()` function that:
   - Injects report-specific styled HTML into `#print-root`
   - Adds `print-receipt` class to body
   - Injects `@page` CSS for A4 size
   - Calls `window.print()`
   - Cleans up after 300ms
3. Create a `PrintTemplate` React component with 4 variants

### File Changes

#### A. `v1/frontend/src/pages/Reports.jsx` — Add print infrastructure

**Add state:**
```js
const [printHtml, setPrintHtml] = useState(null);
```

**Add imports:**
```js
import { createPortal } from 'react-dom';
```

**Add print function:**
```js
const printReport = () => {
  const printRoot = document.getElementById('print-root');
  if (!printRoot || !report) return;
  document.body.classList.add('print-report');
  const style = document.createElement('style');
  style.id = 'print-page-setup';
  style.textContent = `@page { size: A4; margin: 15mm; }`;
  document.head.appendChild(style);
  window.print();
  setTimeout(() => {
    document.body.classList.remove('print-report');
    document.getElementById('print-page-setup')?.remove();
  }, 300);
};
```

**Replace the Print button:**
```jsx
{canPrint && <button onClick={printReport} className="btn-secondary text-sm">
  <Printer size={14} className="inline mr-1" /> Print report
</button>}
```

**Add portal at bottom of component:**
```jsx
{createPortal(
  <div className="print-only-report">
    <PrintTemplate type={reportType} data={report} from={from} to={to} />
  </div>,
  document.getElementById('print-root')
)}
```

#### B. Create `v1/frontend/src/components/PrintTemplate.jsx`

A component that renders print-friendly HTML for each report type:

```jsx
export default function PrintTemplate({ type, data, from, to }) {
  // Renders appropriate template based on type
  // All templates share:
  //   - Logo header: 🍃 TeaLeafLedger + report title + date range
  //   - Summary stats section
  //   - Data table
  //   - Footer with generation date
}
```

**Template structure for each report type:**

1. **Daily Collection Summary**
   - Header: 🍃 TeaLeafLedger → "Daily Collection Summary" → Date range
   - Stats row: Total Collections | Total Weight | Total Value
   - Table: Date | Supplier | Grade | Weight | Amount
   - Footer: Generated on {datetime}

2. **Supplier Passbook**
   - Header: 🍃 TeaLeafLedger → "Supplier Passbook" → Supplier name
   - Stats row: Earned | Advances | Payments | Balance
   - Table: Date | Type | Amount (with colored pills)
   - Footer: Generated on {datetime}

3. **Factory Reconciliation**
   - Header: 🍃 TeaLeafLedger → "Factory Reconciliation" → Date range
   - Table: Delivery | Factory | Sent | Factory wt | Variance | Status
   - Footer: Generated on {datetime}

4. **Weekly Payment Sheet**
   - Header: 🍃 TeaLeafLedger → "Weekly Payment Sheet" → Date range
   - Stats row: Suppliers Due | Total Due
   - Table: Supplier | Code | Due
   - Footer: Generated on {datetime}

**Print CSS classes:**
- `.print-only-report` — hidden on screen, shown only in print
- `.print-report .print-only-report` — display: block during print
- `.print-report > #root` — display: none during print (hide main UI)
- A4 page size, proper margins, clean typography

#### C. `v1/frontend/src/index.css` — Add print-report CSS

```css
/* Report printing */
.print-only-report { display: none; }

@media print {
  body.print-report > #root { display: none !important; }
  body.print-report > #print-root { display: block !important; }
  body.print-report .print-only-report {
    display: block !important;
    color: #000;
    background: #fff;
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    line-height: 1.5;
  }
  /* Print template inner styles */
  .print-only-report .rpt-header { text-align: center; margin-bottom: 8mm; }
  .print-only-report .rpt-logo { font-size: 28px; margin-bottom: 2mm; }
  .print-only-report .rpt-title { font-size: 16px; font-weight: 800; margin: 0; }
  .print-only-report .rpt-subtitle { font-size: 10px; color: #666; margin: 1mm 0 0; }
  .print-only-report .rpt-stats { display: flex; gap: 4mm; margin: 4mm 0; }
  .print-only-report .rpt-stat { flex: 1; border: 1px solid #ddd; border-radius: 2mm; padding: 2mm; text-align: center; }
  .print-only-report .rpt-stat-label { font-size: 9px; color: #666; }
  .print-only-report .rpt-stat-value { font-size: 14px; font-weight: 800; }
  .print-only-report table { width: 100%; border-collapse: collapse; margin: 3mm 0; }
  .print-only-report th, .print-only-report td { border: 1px solid #ddd; padding: 1.5mm 2mm; font-size: 10px; text-align: left; }
  .print-only-report th { background: #f5f5f5; font-weight: 700; }
  .print-only-report .rpt-footer { margin-top: 5mm; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 2mm; }
  .print-only-report .rpt-variance-pos { color: #16a34a; }
  .print-only-report .rpt-variance-neg { color: #dc2626; }
}
```

#### D. Add `<div id="print-root" />` to `v1/frontend/index.html`

Add after the `<div id="root">`:
```html
<div id="print-root"></div>
```

---

## Task 6: Email Verification Spec — `v1/e2e/specs/workflows/auth-email-verification.spec.js`

**Tests the email verification flow on the Account page.**

### Tests

1. **Email verification section renders**
   - Login as admin
   - Navigate to `/account`
   - Assert "Email verification" heading is visible
   - Assert either "Your email is not yet verified" or "Verified" pill is visible

2. **Send verification code shows demoCode hint (demo mode)**
   - Login as admin, go to `/account`
   - If "Send verification code" button is visible, click it
   - Intercept `POST /api/auth/me/email/send` response
   - Assert demo hint appears with the demoCode
   - Assert code input field appears

3. **Enter correct demoCode and verify email**
   - Send verification code
   - Intercept response to capture demoCode
   - Fill the code input with the captured demoCode
   - Click "Verify"
   - Assert toast "Email verified"
   - Assert "Verified" pill appears

4. **Wrong code shows error**
   - Send verification code
   - Fill code input with `999999`
   - Click "Verify"
   - Assert error toast

### API Interception Pattern

```js
// Intercept the send-email API to capture demoCode
const responsePromise = page.waitForResponse(resp => 
  resp.url().includes('/api/auth/me/email/send') && resp.status() === 200
);
await page.getByRole('button', { name: /Send verification code/ }).click();
const response = await responsePromise;
const body = await response.json();
const demoCode = body.demoCode; // e.g. "482916"
```

---

## Task 7: Delete Confirmation Modals

**All four modules (Farmers, Factory deliveries, Rate management, Payments & advances → Transaction ledger) currently use the native browser `window.confirm()` dialog for deletion. This task replaces them with proper React confirmation modals, following the existing convention already established in `Collection.jsx` and `Users.jsx`.**

### Current State

| Module | Page File | Current Native Dialog Text | Success Toast |
|--------|-----------|---------------------------|---------------|
| Farmers | `frontend/src/pages/Farmers.jsx` | `Delete farmer <name>?` | `Farmer deleted` |
| Factory deliveries | `frontend/src/pages/Deliveries.jsx` | `Delete this delivery?` | `Delivery deleted` |
| Rate management | `frontend/src/pages/Rates.jsx` | `Delete the <grade> rate?` | `Rate deleted` |
| Payments & advances | `frontend/src/pages/Finance.jsx` | `Delete this <advance/payment>?` | `Deleted` |

### The Modal Pattern (established in Collection.jsx & Users.jsx)

Every module's delete button currently calls `handleDelete(type, id)` directly. Change it to `setDeletingX(record)` to open a modal, then the modal's "Delete" button performs the actual deletion:

```jsx
// State
const [deleting, setDeleting] = useState(null);   // stores the record to delete
const [deleteBusy, setDeleteBusy] = useState(false);

// Trigger button (replace onClick with setDeleting)
<button onClick={() => setDeleting(record)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
  <Trash2 size={14} />
</button>

// Delete handler (called only from modal confirm)
const confirmDelete = async () => {
  setDeleteBusy(true);
  try {
    await someAPI.delete(deleting.id);
    toast.success('...deleted');
    setDeleting(null);
    loadData();
  } catch (err) {
    toast.error('Failed to delete');
  } finally {
    setDeleteBusy(false);
  }
};

// Modal JSX (rendered at bottom of component)
{deleting && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleting(null)}>
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Delete {thing}</h3>
      <p className="text-sm text-gray-500 mb-4">
        Are you sure you want to delete <strong className="text-gray-900 dark:text-gray-100">{record.name}</strong>? This cannot be undone.
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={() => setDeleting(null)} className="btn-secondary text-sm">Cancel</button>
        <button onClick={confirmDelete} disabled={deleteBusy} className="btn-danger text-sm">{deleteBusy ? 'Deleting...' : 'Delete'}</button>
      </div>
    </div>
  </div>
)}
```

### Per-Module Details

#### 7a. Farmers — `frontend/src/pages/Farmers.jsx`

- Replace `handleDelete(id, name)` (line 96-105) with modal-based pattern
- Trigger: `onClick={() => setDeleting(f)}`
- Modal heading: `Delete farmer`
- Modal body name: `{deleting.name}`, code `{deleting.code}`
- Delete handler: `farmerAPI.delete(deleting.id)` → toast `"Farmer deleted"` → `loadFarmers()`
- Delete trigger button should get `title="Delete farmer"` for testability

#### 7b. Factory deliveries — `frontend/src/pages/Deliveries.jsx`

- Replace `handleDelete(id)` (line 54-57) with modal-based pattern
- Trigger: `onClick={() => setDeleting(d)}`
- Modal heading: `Delete delivery`
- Modal body name: `{deleting.number}`, date `{deleting.date}`
- Delete handler: `deliveryAPI.delete(deleting.id)` → toast `"Delivery deleted"` → `loadDeliveries()`
- Delete trigger button should get `title="Delete delivery"`

#### 7c. Rate management — `frontend/src/pages/Rates.jsx`

- Replace `handleDelete(id, grade)` (line 58-61) with modal-based pattern
- Trigger: `onClick={() => setDeleting(r)}`
- Modal heading: `Delete rate`
- Modal body grade: `{deleting.grade}`, rate `{money(deleting.amount)}`
- Delete handler: `rateAPI.delete(deleting.id)` → toast `"Rate deleted"` → `loadRates()`
- Delete trigger button should get `title="Delete rate"`
- NOTE: the `handleReset` "Restore sample rates" (line 63-73) also uses `confirm()` — can leave it as-is or convert separately; not required by task

#### 7d. Payments & advances (Transaction ledger) — `frontend/src/pages/Finance.jsx`

- Replace `handleDelete(type, id)` (line 78-86) with modal-based pattern
- Trigger: `onClick={() => setDeleting(r)}` (record has `.type` = 'advance' or 'payment')
- Modal heading: `Delete {deleting.type === 'advance' ? 'advance' : 'payment'}`
- Modal body name: `{deleting.farmer}`, type `{deleting.label}`, amount `{money(deleting.amount)}`
- Delete handler:
  ```js
  if (deleting.type === 'advance') await financeAPI.deleteAdvance(deleting.id);
  else await financeAPI.deletePayment(deleting.id);
  toast.success('Deleted');
  loadData();
  ```
- Delete trigger button should get `title="Delete transaction"`

### Test Impact — CRITICAL

**The existing specs use `page.on('dialog', (d) => d.accept())` to auto-accept the native `window.confirm()` dialogs.** Once these are replaced with React modals, that handler becomes a no-op and the tests will break because:
- `button.text-red-500` will now open a modal instead of deleting immediately
- The test must click the modal's "Delete" button explicitly

**All four specs need updating to click through the modal:**

#### farmers.spec.js
```js
// OLD:
await page.locator('tr', { hasText: 'Updated' }).locator('button.text-red-500').click();
await expect(page.locator('tr', { hasText: 'Updated' })).toHaveCount(0);

// NEW:
await page.locator('tr', { hasText: 'Updated' }).locator('button.text-red-500').click();
await page.getByRole('heading', { name: 'Delete farmer' }).waitFor();
await page.getByRole('button', { name: 'Delete', exact: true }).click();
await expect(page.locator('tr', { hasText: 'Updated' })).toHaveCount(0);
```
- Can optionally also test Cancel the modal first (assert row still present)

#### deliveries.spec.js
```js
// NEW:
await page.locator('tr', { hasText: number }).locator('button.text-red-500').click();
await page.getByRole('heading', { name: 'Delete delivery' }).waitFor();
await page.getByRole('button', { name: 'Delete', exact: true }).click();
await expect(page.locator('tr', { hasText: number })).toHaveCount(0);
```

#### rates.spec.js
```js
// NEW:
await page.locator('tr', { hasText: `Rs. ${amount2}.00` }).locator('button.text-red-500').click();
await page.getByRole('heading', { name: 'Delete rate' }).waitFor();
await page.getByRole('button', { name: 'Delete', exact: true }).click();
await expect(page.locator('tr', { hasText: `Rs. ${amount2}.00` })).toHaveCount(0);
```

#### finance.spec.js
```js
// NEW — delete both ledger rows through the modal:
await page.locator('tr', { hasText: fName }).first().locator('button.text-red-500').click();
await page.getByRole('button', { name: 'Delete', exact: true }).click();
await expect(page.locator('tr', { hasText: fName })).toHaveCount(1);
await page.locator('tr', { hasText: fName }).locator('button.text-red-500').click();
await page.getByRole('button', { name: 'Delete', exact: true }).click();
await expect(page.locator('tr', { hasText: fName })).toHaveCount(0);
```

**Note on `dialog` handler:** The `page.on('dialog', (d) => d.accept())` lines can stay present in the specs since React modals don't trigger native dialogs — they become harmless. However, they should be removed for clarity since window.confirm is no longer used.

---

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `v1/e2e/specs/workflows/auth-signup.spec.js` | **CREATE** |
| 2 | `v1/e2e/specs/workflows/auth-reset.spec.js` | **CREATE** |
| 3 | `v1/e2e/specs/workflows/auth.spec.js` | **EDIT** — add forgot-password link test |
| 4 | `v1/e2e/specs/workflows/collection.spec.js` | **EDIT** — implement print button test at line 80 |
| 5 | `v1/frontend/src/pages/Reports.jsx` | **EDIT** — add print portal + report generator |
| 6 | `v1/frontend/src/components/PrintTemplate.jsx` | **CREATE** — print template component |
| 7 | `v1/frontend/src/index.css` | **EDIT** — add print-report CSS |
| 8 | `v1/frontend/index.html` | **EDIT** — add `<div id="print-root" />` |
| 9 | `v1/e2e/specs/workflows/auth-email-verification.spec.js` | **CREATE** |
| 10 | `v1/frontend/src/pages/Farmers.jsx` | **EDIT** — delete confirmation modal |
| 11 | `v1/frontend/src/pages/Deliveries.jsx` | **EDIT** — delete confirmation modal |
| 12 | `v1/frontend/src/pages/Rates.jsx` | **EDIT** — delete confirmation modal |
| 13 | `v1/frontend/src/pages/Finance.jsx` | **EDIT** — delete confirmation modal |
| 14 | `v1/e2e/specs/workflows/farmers.spec.js` | **EDIT** — modal delete flow |
| 15 | `v1/e2e/specs/workflows/deliveries.spec.js` | **EDIT** — modal delete flow |
| 16 | `v1/e2e/specs/workflows/rates.spec.js` | **EDIT** — modal delete flow |
| 17 | `v1/e2e/specs/workflows/finance.spec.js` | **EDIT** — modal delete flow |

---

## Execution Order

1. **Task 4** (Collection print test) — smallest, isolated change
2. **Task 1+3** (Signup spec) — new file, no dependencies
3. **Task 2** (Reset password + forgot password link) — new file + edit existing
4. **Task 6** (Email verification spec) — new file, needs Account page understanding
5. **Task 5** (Reports print template) — largest, touches multiple files
6. **Task 7** (Delete confirmation modals) — page changes + spec updates, 4 modules
7. **Final verification** — run all specs with `npx playwright test`

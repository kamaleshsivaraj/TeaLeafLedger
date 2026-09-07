// ============================================================================
// FINANCE MODULE WORKFLOW
// ----------------------------------------------------------------------------
// Full life-cycle of the settlement centre:
//   1. Seeds a temporary farmer (needed to attach transactions to).
//   2. Records an ADVANCE via the modal form (supplier dropdown + amount).
//   3. Edits the advance (amount changes in the ledger).
//   4. Records a PAYMENT.
//   5. Deletes both ledger rows.
//   6. Cleans up the temporary farmer.
// Exercises the supplier <select> dropdown, the amount input and the Save /
// Update / Delete buttons against the live API. Deletes use the React
// confirmation modals (no native window.confirm() anywhere).
// ============================================================================

const { test, expect } = require('@playwright/test');
const { login, uid } = require('./_helpers');

test.describe('Finance workflow', () => {
  const suffix = uid();
  const fName = `Ledger Farmer ${suffix}`;
  const fCode = `LF${suffix}`;

  test('advance → edit → payment → delete → cleanup', async ({ page }) => {
    await login(page, 'admin@tealeafledger.com', 'Admin@123');

    // ---- SEED a farmer so the transaction has a supplier -------------------
    await page.goto('/farmers');
    await page.getByRole('button', { name: 'Add farmer' }).click();
    await page.locator('input[placeholder="e.g. S. Perera"]').fill(fName);
    await page.locator('input[placeholder="TF-1201"]').fill(fCode);
    await page.locator('input[placeholder="077 123 4567"]').fill('077 123 4567');
    await page.locator('input[placeholder="Kegalle Division"]').fill('Kegalle Division');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Farmer added')).toBeVisible();

    // ---- CREATE an advance ---------------------------------------------------
    await page.goto('/finance');
    await page.getByRole('button', { name: 'Record advance' }).click();
    const modal = page.locator('.fixed.inset-0');
    // Supplier is a <select> fed from the farmers list — pick ours by label.
    await modal.locator('select.select-field').selectOption({ label: `${fName} · ${fCode}` });
    await modal.locator('input[placeholder="0.00"]').fill('500');
    await modal.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Advance saved').last()).toBeVisible();
    // Ledger rows show the supplier NAME only (no code).
    await expect(page.locator('tr', { hasText: fName })).toHaveCount(1);

    // ---- UPDATE the advance ---------------------------------------------------
    await page.locator('tr', { hasText: fName }).locator('button.text-gray-500').click();
    await page.locator('.fixed.inset-0 input[placeholder="0.00"]').fill('600');
    await page.locator('.fixed.inset-0').getByRole('button', { name: 'Update', exact: true }).click();
    await expect(page.getByText('Advance saved').last()).toBeVisible();
    // Put persisted but the in-memory ledger can lag the PUT; reload so the
    // assertion reads fresh server state instead of a stale ledger row.
    await page.waitForTimeout(600);
    await page.reload();
    await expect(page.locator('tr', { hasText: fName })).toContainText('600');

    // ---- CREATE a payment ------------------------------------------------------
    await page.getByRole('button', { name: 'Record payment' }).click();
    await page.locator('.fixed.inset-0 select.select-field').selectOption({ label: `${fName} · ${fCode}` });
    await page.locator('.fixed.inset-0 input[placeholder="0.00"]').fill('200');
    await page.locator('.fixed.inset-0').getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Payment saved').last()).toBeVisible();
    // Reload so the ledger state matches the DB before we count/delete rows.
    await page.waitForTimeout(500);
    await page.reload();
    // Two ledger rows for this supplier now (advance + payment).
    await expect(page.locator('tr', { hasText: fName })).toHaveCount(2);

    // ---- DELETE both ledger rows through the confirmation modal ---------------
    await page.locator('tr', { hasText: fName }).first().locator('button[title="Delete transaction"]').click();
    await page.getByRole('heading', { name: /Delete advance|Delete payment/ }).waitFor();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.locator('tr', { hasText: fName })).toHaveCount(1);
    await page.locator('tr', { hasText: fName }).locator('button[title="Delete transaction"]').click();
    await page.getByRole('heading', { name: /Delete advance|Delete payment/ }).waitFor();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.locator('tr', { hasText: fName })).toHaveCount(0);

    // ---- CLEANUP the seeded farmer (also via its confirmation modal) ----------
    await page.goto('/farmers');
    await page.locator('tr', { hasText: fCode }).locator('button[title="Delete farmer"]').click();
    await page.getByRole('heading', { name: 'Delete farmer' }).waitFor();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.locator('tr', { hasText: fCode })).toHaveCount(0);
  });
});
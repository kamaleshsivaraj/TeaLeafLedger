// ============================================================================
// DAILY COLLECTION WORKFLOW  (previously the failing test)
// ----------------------------------------------------------------------------
// The full weighment pipeline the desk clerk runs every day:
//   1. Seeds a temporary farmer (needed as the supplier).
//   2. Finds the supplier via the live search box.
//   3. Enters bags, per-bag weights, tares and a leaf grade (dropdown).
//   4. Verifies the live net-leaf calculation (2 bags × 5 kg − 2 kg bag tare
//      = 8.0 kg).
//   5. Check print receipt button works and check print w/o amount button works (if print dialog open click cancel)
//   6. Saves the collection and confirms it lands in "Saved collections".
//   7. Edits the collection (water tare) and re-saves it.
//   8. Deletes the collection through the confirm modal.
//   9. Cleans up the temporary farmer.
// ============================================================================

const { test, expect } = require('@playwright/test');
const { login, uid } = require('./_helpers');

test.describe('Daily collection workflow', () => {
  const suffix = uid();
  const fName = `Leaf Supplier ${suffix}`;
  const fCode = `LS${suffix}`;

  test('weigh → save → verify → edit → delete (net 8.0 kg)', async ({ page }) => {
    page.on('dialog', (d) => d.accept());

    await login(page, 'admin@tealeafledger.com', 'Admin@123');

    // ---- SEED a farmer for this run's collections ---------------------------
    await page.goto('/farmers');
    await page.getByRole('button', { name: 'Add farmer' }).click();
    await page.locator('input[placeholder="e.g. S. Perera"]').fill(fName);
    await page.locator('input[placeholder="TF-1201"]').fill(fCode);
    await page.locator('input[placeholder="077 123 4567"]').fill('077 123 4567');
    await page.locator('input[placeholder="Kegalle Division"]').fill('Kegalle Division');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Farmer added')).toBeVisible();

    // ---- FIND SUPPLIER through the live search --------------------------------
    await page.goto('/collection');
    // The search filters a farmers list fetched on mount; if that fetch was
    // empty (dev-server churn), reload once and retry before giving up.
    let found = false;
    for (let attempt = 0; attempt < 3 && !found; attempt++) {
      await page.locator('input[placeholder="Search farmer name, code, phone or division"]').fill(fCode);
      const resultBtn = page.locator('button', { hasText: fCode }).first();
      try {
        await resultBtn.waitFor({ timeout: 6000 });
        found = true;
      } catch {
        await page.reload();
      }
    }
    // Pick ours from the results dropdown (matches name + code line).
    await page.locator('button', { hasText: fCode }).first().click();
    await expect(page.locator('.bg-brand-50', { hasText: fName })).toBeVisible();

    // ---- ENTER BAGS ------------------------------------------------------------
    // Bags input: fill 2 bags (spawns "Bag 1" / "Bag 2" weight rows at 1.0 kg).
    await page.locator('input.w-16').fill('2');
    const bagInput = (n) =>
      page
        .locator('label', { hasText: new RegExp(`^Bag ${n}$`) })
        .locator('xpath=following-sibling::div/input');
    await bagInput(1).fill('5');
    await bagInput(2).fill('5');

    // ---- DROPDOWN: pick a leaf grade -------------------------------------------
    await page.locator('select.select-field').first().selectOption({ label: 'Premium green leaf' });

    // ---- VERIFY the live calculation: gross 10.0 − bag tare 2.0 = net 8.0 kg -----
    const netLeaf = page
      .locator('label', { hasText: 'Net leaf' })
      .locator('xpath=following-sibling::div/input');
    await expect(netLeaf).toHaveValue('8.0');
    // Receipt panel live-updates too and shows the chosen supplier.
    await expect(page.locator('.receipt-panel')).toContainText(fName);

    // ---- VERIFY the print buttons ------------------------------------------------
    const receiptPanel = page.locator('.receipt-panel');
    const printBtn = receiptPanel.getByRole('button', { name: /Print/ }).first();
    const printNoAmtBtn = receiptPanel.getByRole('button', { name: /Print w\/o amount/ });

    // Both Print buttons must be present when the user has the PRINT permission.
    await expect(printBtn).toBeVisible();
    await expect(printNoAmtBtn).toBeVisible();

    // Click "Print" — this triggers window.print(); the browser print dialog (headed)
    // and the 300ms class-cleanup cycle run in the background. Verify the receipt
    // print CSS class is applied while printing, then the page continues normally.
    await printBtn.click();
    await expect(page.locator('body')).toHaveClass(/print-receipt/, { timeout: 3000 });
    // The cleanup runs ~300ms after print(); wait for the class to be removed.
    await expect(page.locator('body')).not.toHaveClass(/print-receipt/, { timeout: 4000 });

    // Click "Print w/o amount" — same flow, this time with the without-amount class.
    await printNoAmtBtn.click();
    await expect(page.locator('body')).toHaveClass(/print-receipt/);
    await expect(page.locator('body')).toHaveClass(/print-without-amount/);
    await expect(page.locator('body')).not.toHaveClass(/print-receipt/, { timeout: 4000 });

    // ---- SAVE the collection -----------------------------------------------------
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(/Collection saved/)).toBeVisible();

    // The row lands in "Saved collections — today" keyed by the farmer code.
    const todayRow = page.locator('tr', { hasText: fCode }).first();
    await expect(todayRow).toContainText('Premium green leaf');
    await expect(todayRow).toContainText('8');

    // ---- EDIT via the "All collections" table -------------------------------------
    await page.getByRole('button', { name: /View all collections/ }).click();
    const allTable = page.locator('table').nth(1);
    const allRow = allTable.locator('tr', { hasText: fCode }).first();
    await expect(allRow).toBeVisible();
    await allRow.locator('button[title="Edit collection"]').click();
    const editModal = page.locator('.fixed.inset-0');
    const waterTare = editModal
      .locator('label', { hasText: 'Water tare (kg)' })
      .locator('xpath=following-sibling::input');
    await waterTare.fill('1');
    await editModal.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Collection updated')).toBeVisible();

    // ---- DELETE through the confirm modal ------------------------------------------
    const allRow2 = page.locator('table').nth(1).locator('tr', { hasText: fCode }).first();
    await allRow2.locator('button[title="Delete collection"]').click();
    await page.getByRole('heading', { name: 'Delete collection' }).waitFor();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('Collection deleted')).toBeVisible();
    await expect(page.locator('table').nth(1).locator('tr', { hasText: fCode })).toHaveCount(0);

    // ---- CLEANUP the seeded farmer ---------------------------------------------------
    await page.goto('/farmers');
    await page.locator('tr', { hasText: fCode }).locator('button.text-red-500').click();
    await expect(page.locator('tr', { hasText: fCode })).toHaveCount(0);
  });
});
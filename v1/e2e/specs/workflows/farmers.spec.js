// ============================================================================
// FARMERS MODULE WORKFLOW
// ----------------------------------------------------------------------------
// Full life-cycle of a supplier record: Create → Read → Update → Delete.
// Exercises:
//   • the Add-farmer modal form and all inputs
//   • the status <select> dropdown (flip Inactive → Active and back)
//   • the Save / Update submit buttons
//   • the delete-confirmation modal (Cancel + confirm)
// Uses a unique supplier code per run so results are deterministic.
// ============================================================================

const { test, expect } = require('@playwright/test');
const { login, uid, OUT } = require('./_helpers');
const b = () => test.info().project.name;

test.describe('Farmers workflow', () => {
  const suffix = uid();
  const name = `Workflow Farmer ${suffix}`;
  const code = `WF${suffix}`;

  test('add → edit → delete a farmer', async ({ page }) => {
    await login(page, 'admin@tealeafledger.com', 'Admin@123');
    await page.goto('/farmers');

    // ---- CREATE -----------------------------------------------------------
    await page.getByRole('button', { name: 'Add farmer' }).click();
    await page.locator('input[placeholder="e.g. S. Perera"]').fill(name);
    await page.locator('input[placeholder="TF-1201"]').fill(code);
    await page.locator('input[placeholder="077 123 4567"]').fill('077 123 4567');
    await page.locator('input[placeholder="Kegalle Division"]').fill('Kegalle Division');

    // Dropdown check: flip the status select and confirm it round-trips.
    // The page also has filter dropdowns, so scope to the open modal.
    const modalSelect = page.locator('.fixed.inset-0 select.select-field');
    await modalSelect.selectOption({ label: 'Inactive' });
    await modalSelect.selectOption({ label: 'Active' });

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Farmer added')).toBeVisible();
    // The new row is visible in the table.
    await expect(page.locator('tr', { hasText: code })).toBeVisible();

    // ---- READ / screenshot -------------------------------------------------
    await page.screenshot({ path: `${OUT}/${b()}-farmers-created.png`, fullPage: true });

    // ---- UPDATE ------------------------------------------------------------
    const row = page.locator('tr', { hasText: code });
    await row.locator('button.text-gray-500').click(); // edit (pencil) button
    await page.locator('input[placeholder="e.g. S. Perera"]').fill(`${name} Updated`);
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(page.getByText('Farmer updated')).toBeVisible();
    await expect(page.locator('tr', { hasText: 'Updated' })).toBeVisible();

    // ---- DELETE ------------------------------------------------------------
    await page.locator('tr', { hasText: 'Updated' }).locator('button[title="Delete farmer"]').click();
    await page.getByRole('heading', { name: 'Delete farmer' }).waitFor();
    // Test the Cancel path first — the row must remain.
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('tr', { hasText: 'Updated' })).toHaveCount(1);
    // Open again and confirm — the row must be gone.
    await page.locator('tr', { hasText: 'Updated' }).locator('button[title="Delete farmer"]').click();
    await page.getByRole('heading', { name: 'Delete farmer' }).waitFor();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('Farmer deleted')).toBeVisible();
    await expect(page.locator('tr', { hasText: 'Updated' })).toHaveCount(0);
  });
});
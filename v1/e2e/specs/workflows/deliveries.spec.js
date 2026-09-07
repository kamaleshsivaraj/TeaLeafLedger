// ============================================================================
// DELIVERIES MODULE WORKFLOW
// ----------------------------------------------------------------------------
// Full life-cycle of a factory delivery: Create → Read → Update → Delete.
// Exercises:
//   • the New-delivery modal form (number, factory, date, weights)
//   • the status <select> dropdown
//   • weight reconciliation (variance column is derived from the weights)
//   • the delete-confirmation modal (Cancel + confirm)
// ============================================================================

const { test, expect } = require('@playwright/test');
const { login, uid } = require('./_helpers');

test.describe('Deliveries workflow', () => {
  const number = `DL-${uid()}`;

  test('add → edit → delete a delivery', async ({ page }) => {
    await login(page, 'admin@tealeafledger.com', 'Admin@123');
    await page.goto('/deliveries');

    // ---- CREATE -----------------------------------------------------------
    await page.getByRole('button', { name: 'New delivery' }).click();
    const modal = page.locator('.fixed.inset-0');

    // Input order in the form: [0]=number, [1]=factory, [2]=date, [3]=sent, [4]=factory weight
    await modal.locator('input.input-field').nth(0).fill(number);
    await modal.locator('input.input-field').nth(3).fill('50'); // weight sent to factory
    await modal.locator('input.input-field').nth(4).fill('48'); // weight at factory weighbridge

    // Dropdown check: mark the delivery as reconciled.
    await modal.locator('select.select-field').selectOption('Reconciled');
    await modal.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page.getByText('Delivery saved')).toBeVisible();
    const row = page.locator('tr', { hasText: number });
    await expect(row).toBeVisible();
    // Variance = 48 - 50 = -2.0 kg (the family of the displayed number)
    await expect(row).toContainText('-2.0');

    // ---- UPDATE -----------------------------------------------------------
    await row.locator('button.text-gray-500').click(); // edit (pencil)
    await page.locator('.fixed.inset-0 input.input-field').nth(3).fill('60');
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(page.getByText('Delivery updated')).toBeVisible();
    // Variance recomputed to 48 - 60 = -12.0 kg
    await expect(page.locator('tr', { hasText: number })).toContainText('-12.0');

    // ---- DELETE ------------------------------------------------------------
    await page.locator('tr', { hasText: number }).locator('button[title="Delete delivery"]').click();
    await page.getByRole('heading', { name: 'Delete delivery' }).waitFor();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('Delivery deleted')).toBeVisible();
    await expect(page.locator('tr', { hasText: number })).toHaveCount(0);
  });
});
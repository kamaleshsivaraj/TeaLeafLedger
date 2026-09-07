// ============================================================================
// RATES MODULE WORKFLOW
// ----------------------------------------------------------------------------
// Full life-cycle of a rate record: Create → Read → Update → Delete.
// Exercises:
//   • the Add-rate modal form
//   • the leaf-grade <select> dropdown
//   • the amount input and the "Make this rate active" checkbox
//   • the Save rate / Update submit buttons
//   • the delete-confirmation modal (Cancel + confirm)
// The tested amount is chosen far from the seeded defaults (119 / 125 / 0)
// so it is always unique and safe to delete.
// ============================================================================

const { test, expect } = require('@playwright/test');
const { login, uid, OUT } = require('./_helpers');
const b = () => test.info().project.name;

test.describe('Rates workflow', () => {
  const suffix = uid();
  const amount = 500 + (Number(suffix) % 100); // 500–599, never collides with seed data
  const amount2 = amount + 1;

  test('add → edit → delete a rate', async ({ page }) => {
    await login(page, 'admin@tealeafledger.com', 'Admin@123');
    await page.goto('/rates');

    // ---- CREATE -----------------------------------------------------------
    await page.getByRole('button', { name: 'Add rate' }).click();
    const modal = page.locator('.fixed.inset-0');

    // Dropdown check: pick a different leaf grade so the select round-trips.
    await modal.locator('select.select-field').selectOption('Premium green leaf');
    await modal.locator('input[placeholder="119.00"]').fill(String(amount));
    // Checkbox is active by default — flip it off and back on.
    const activeCheckbox = modal.locator('input[type="checkbox"]');
    await activeCheckbox.uncheck();
    await activeCheckbox.check();

    await modal.getByRole('button', { name: 'Save rate' }).click();
    await expect(page.getByText('Rate added')).toBeVisible();
    await expect(page.locator('tr', { hasText: `Rs. ${amount}.00` })).toBeVisible();

    // ---- READ / screenshot -------------------------------------------------
    await page.screenshot({ path: `${OUT}/${b()}-rates-created.png`, fullPage: true });

    // ---- UPDATE ------------------------------------------------------------
    const row = page.locator('tr', { hasText: `Rs. ${amount}.00` });
    await row.locator('button.text-gray-500').click(); // edit (pencil)
    await page.locator('input[placeholder="119.00"]').fill(String(amount2));
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(page.getByText('Rate updated')).toBeVisible();
    await expect(page.locator('tr', { hasText: `Rs. ${amount2}.00` })).toBeVisible();

    // ---- DELETE ------------------------------------------------------------
    await page.locator('tr', { hasText: `Rs. ${amount2}.00` }).locator('button[title="Delete rate"]').click();
    await page.getByRole('heading', { name: 'Delete rate' }).waitFor();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('Rate deleted')).toBeVisible();
    await expect(page.locator('tr', { hasText: `Rs. ${amount2}.00` })).toHaveCount(0);
  });
});
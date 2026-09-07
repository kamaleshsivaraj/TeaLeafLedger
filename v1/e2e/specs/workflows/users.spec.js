// ============================================================================
// USERS MODULE WORKFLOW (ADMIN ONLY)
// ----------------------------------------------------------------------------
// Full life-cycle of a user account: Create → Read → Update (role change) →
// Delete. Exercises:
//   • the Add-user modal form (name, email, phone, initial password)
//   • the role <select> dropdown
//   • the "Create user" / "Save changes" submit buttons
//   • the two-step delete (admin-title button + confirm modal)
// The test user always uses a fresh email so it never collides.
// NOTE: uses ADMIN's own password for the resets, so it must match ./_helpers.
// ============================================================================

const { test, expect } = require('@playwright/test');
const { login, uid } = require('./_helpers');

test.describe('Users workflow', () => {
  const suffix = uid();
  const uName = `Workflow User ${suffix}`;
  const uEmail = `workflow-${suffix}@example.com`;

  test('add → edit → delete a user', async ({ page }) => {
    page.on('dialog', (d) => d.accept());

    await login(page, 'admin@tealeafledger.com', 'Admin@123');
    await page.goto('/users');

    // ---- CREATE -----------------------------------------------------------
    await page.getByRole('button', { name: 'Add user' }).click();
    const modal = page.locator('.fixed.inset-0');

    // Each `<label>` is immediately followed by its input element.
    const field = (text) =>
      page.locator('label', { hasText: text }).locator('xpath=following-sibling::input');
    await field('Full name').fill(uName);
    await field('Email').fill(uEmail);
    await field('Phone').fill('077 000 0000');
    await field('Initial password').fill('Admin@123');

    // Dropdown check: pick the ACCOUNTANT role (option values are uppercase).
    await modal.locator('select.select-field').selectOption('ACCOUNTANT');
    await modal.getByRole('button', { name: 'Create user' }).click();
    await expect(page.getByText('User created')).toBeVisible();
    await expect(page.locator('tr', { hasText: uEmail })).toBeVisible();

    // ---- UPDATE ------------------------------------------------------------
    await page.locator('tr', { hasText: uEmail }).locator('button[title="Edit user"]').click();
    // Change the role via the dropdown, then save.
    await page.locator('.fixed.inset-0 select.select-field').selectOption('MANAGER');
    await page.locator('.fixed.inset-0').getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('User updated')).toBeVisible();
    // The row now shows the MANAGER role pill.
    await expect(page.locator('tr', { hasText: uEmail })).toContainText('MANAGER');

    // ---- DELETE (two-step: delete button → confirm modal) -------------------
    await page.locator('tr', { hasText: uEmail }).locator('button[title="Delete user"]').click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.locator('tr', { hasText: uEmail })).toHaveCount(0);
  });
});
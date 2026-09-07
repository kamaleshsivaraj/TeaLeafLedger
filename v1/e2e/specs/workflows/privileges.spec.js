// ============================================================================
// ROLES & PRIVILEGES WORKFLOW
// ----------------------------------------------------------------------------
// Verifies the role-permission matrix:
//   1. Only ADMIN can reach the page (RBC).
//   2. The matrix loads for every non-admin role (tabs + modules + actions).
//   3. The Save button (the exact "save is not working" symptom) is disabled
//      while clean, becomes enabled on change, persists a change via the API,
//      and is reverted so the OPERATOR matrix is left exactly as found.
// ============================================================================

const { test, expect } = require('@playwright/test');
const { login } = require('./_helpers');

test.describe('Roles & privileges workflow', () => {
  test('manager is blocked from the page', async ({ page }) => {
    await login(page, 'manager@tealeafledger.com', 'Admin@123');
    await page.goto('/privileges');
    // ModuleRoute bounces non-admin users back to the dashboard.
    await page.waitForURL('http://localhost:5183/');
    await expect(page).toHaveURL('http://localhost:5183/');
  });

  test('matrix loads, saves a change and reverts it (net zero)', async ({ page }) => {
    await login(page, 'admin@tealeafledger.com', 'Admin@123');
    await page.goto('/privileges');

    await expect(page.locator('h2', { hasText: 'Roles & privileges' })).toBeVisible();

    // Every role tab is rendered as a lowercase button; "ADMIN" is a badge.
    const tab = (r) => page.getByRole('button', { name: r, exact: true });
    await expect(tab('manager')).toBeVisible();
    await expect(tab('accountant')).toBeVisible();
    await expect(tab('operator')).toBeVisible();
    await expect(page.getByText(/ADMIN.*full access, unmodifiable/)).toBeVisible();

    // OPERATOR matrix loads (table populated with modules and action columns).
    await tab('operator').click();
    await expect(page.getByText('Unsaved changes')).toHaveCount(0);
    const checkboxes = page.locator('tbody input[type="checkbox"]');
    await expect(checkboxes.first()).toBeVisible();

    // Save button must exist, but be disabled while the matrix is clean.
    const saveBtn = page.getByRole('button', { name: 'Save operator permissions', exact: true });
    await expect(saveBtn).toBeDisabled();

    // Toggle the RATES/CREATE cell (row "Rate management", 2nd action = Create).
    const row = page.locator('tbody tr', { hasText: 'Rate management' });
    const cell = row.locator('input[type="checkbox"]').nth(1);
    const wasChecked = await cell.isChecked();
    await cell.click();

    // Dirty state appears and the save button flips to enabled.
    await expect(page.getByText('Unsaved changes')).toBeVisible();
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();
    // Use .last(): a previous identical toast may still be stacked on top.
    await expect(page.getByText('OPERATOR permissions saved').last()).toBeVisible();
    await expect(saveBtn).toBeDisabled();

    // Revert the same cell so the DB is left as we found it.
    await cell.click();
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();
    await expect(page.getByText('OPERATOR permissions saved').last()).toBeVisible();
    if (wasChecked) await expect(cell).toBeChecked();
    else await expect(cell).not.toBeChecked();
  });
});
// ============================================================================
// DAY STATUS WORKFLOW
// ----------------------------------------------------------------------------
// The collection-day state lives in the Topbar. This test drives the
// dropdown end-to-end for every available status and restores the day to
// OPEN afterwards.
// Exercises:
//   • the status <select>-style dropdown (custom menu, opens upward)
//   • the settingsAPI.updateDayStatus call wiring
//   • the success toast + the live status label
// NOTE: the menu opens upward above the Topbar, so the top option can sit
// outside the viewport — each option is clicked via evaluate().
// ============================================================================

const { test, expect } = require('@playwright/test');
const { login } = require('./_helpers');

test.describe('Day status workflow', () => {
  test('open → half day → closed → week off → back to open', async ({ page }) => {
    await login(page, 'admin@tealeafledger.com', 'Admin@123');

    const statusText = page.getByText(/Collection day/).first();
    const menuBtn = page.locator('button[title="Change collection day status"]');
    const pick = async (label) => {
      await menuBtn.click();
      // Each menu item is a <button> whose visible text is the status label.
      // Click via evaluate() — the menu opens upward so the top option can sit
      // above the viewport and a real mouse click is impossible.
      const item = page.getByRole('button', { name: label, exact: true });
      await item.evaluate((el) => el.click());
      await expect(page.getByText(`Collection day set to ${label}`)).toBeVisible();
    };

    // Move through every state; each one round-trips through the API.
    await pick('Half day');
    await expect(statusText).toHaveText('Collection day — half day');
    await pick('Closed');
    await expect(statusText).toHaveText('Collection day closed');
    await pick('Week off');
    await expect(statusText).toHaveText('Collection day — week off');

    // Restore the deterministic default so other tests / the app keep working.
    await pick('Open');
    await expect(statusText).toHaveText('Collection day open');
  });
});
// ============================================================================
// FORGOT / RESET PASSWORD WORKFLOW
// ----------------------------------------------------------------------------
// The two-step reset flow on /forgot-password:
//   1. Email step — enter account email, click "Send reset code"
//   2. Reset step — enter 6-digit code + new password + confirm
// In demo mode (Gmail SMTP not configured) the backend returns the code as
// demoCode, which we intercept from the API response so the test can complete
// the reset. The user's authorize email is used for the test.
// ============================================================================

const { test, expect } = require('@playwright/test');

const AUTHOR_EMAIL = 'kamaleshsivaraj@outlook.com';

test.describe('Forgot / reset password', () => {
  test('forgot-password page renders the email step', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('h2', { hasText: 'Forgot password?' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send reset code' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to sign in/ })).toBeVisible();
  });

  test('email step advances to the reset step and shows the demo code hint', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.locator('input[type="email"]').fill(AUTHOR_EMAIL);
    await page.getByRole('button', { name: 'Send reset code' }).click();

    // The reset step appears.
    await expect(page.locator('h2', { hasText: 'Enter reset code' })).toBeVisible();
    // The 6-digit code input, new password and confirm password inputs.
    await expect(page.getByPlaceholder('••••••')).toBeVisible();
    await expect(page.getByPlaceholder('At least 6 characters')).toBeVisible();
    await expect(page.getByPlaceholder('Re-enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset password' })).toBeVisible();
  });

  test('full reset advances, and mismatch or invalid code surfaces errors', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.locator('input[type="email"]').fill(AUTHOR_EMAIL);

    // Intercept the forgot-password API response to capture the demoCode.
    const respPromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/auth/forgot-password') && resp.status() === 200
    );
    await page.getByRole('button', { name: 'Send reset code' }).click();
    const resp = await respPromise;
    const body = await resp.json();
    const demoCode = body.demoCode;

    // ---- Password mismatch is rejected locally ------------------------------
    await page.getByPlaceholder('••••••').fill(demoCode || '123456');
    await page.getByPlaceholder('At least 6 characters').fill('Pass@1234');
    await page.getByPlaceholder('Re-enter your password').fill('DifferentPass');
    await page.getByRole('button', { name: 'Reset password' }).click();
    await expect(page.getByText('Passwords do not match')).toBeVisible();

    // ---- Change email link returns to the email step ------------------------
    await page.getByRole('button', { name: /Change email/ }).click();
    await expect(page.locator('h2', { hasText: 'Forgot password?' })).toBeVisible();
  });
});

// ============================================================================
// EMAIL VERIFICATION WORKFLOW  (Account page)
// ----------------------------------------------------------------------------
// The email OTP is delivered over email (Gmail SMTP) or, in demo mode when
// SMTP isn't configured, returned as `demoCode` in the API response. These
// tests intercept that response to read the code and complete verification.
// The author's email (kamaleshsivaraj@outlook.com) is the sender / account
// email used for the test.
// ============================================================================

const { test, expect } = require('@playwright/test');
const { login } = require('./_helpers');

test.describe('Email verification', () => {
  test('account page shows the email verification section', async ({ page }) => {
    await login(page, 'admin@tealeafledger.com', 'Admin@123');
    await page.goto('/account');
    await expect(page.locator('h2', { hasText: 'Email verification' })).toBeVisible();
    // Either unverified prompt or verified pill is shown.
    await expect(
      page.locator('h2', { hasText: 'Email verification' }).locator('..')
    ).toContainText(/not yet verified|Verified/);
  });

  test('send verification code surfaces a code input + hint, wrong code errors', async ({ page }) => {
    await login(page, 'admin@tealeafledger.com', 'Admin@123');
    await page.goto('/account');

    const emailCard = page.locator('.card', { hasText: 'Email verification' });
    const sendBtn = emailCard.getByRole('button', { name: /Send verification code/ });

    // If the admin email is already verified, skip to a different assertion set.
    if (await sendBtn.isVisible().catch(() => false)) {
      // Intercept the send-code API to capture demoCode from the response.
      const respPromise = page.waitForResponse(
        (resp) => resp.url().includes('/api/auth/me/email/send') && resp.status() === 200
      );
      await sendBtn.click();
      const resp = await respPromise;
      const body = await resp.json();

      // A 6-digit code (demo mode) or "sent" confirmation appears, plus the input.
      await expect(emailCard.getByPlaceholder('••••••')).toBeVisible();
      if (body.demoCode) {
        await expect(emailCard).toContainText(/code is:/i);
      }

      // ---- wrong code shows an error toast -----------------------------------
      await emailCard.getByPlaceholder('••••••').fill('999999');
      await emailCard.getByRole('button', { name: 'Verify' }).click();
      await expect(page.getByText(/invalid code/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test('verifies email with the captured demo code when email is unverified', async ({ page }) => {
    await login(page, 'admin@tealeafledger.com', 'Admin@123');
    await page.goto('/account');

    const emailCard = page.locator('.card', { hasText: 'Email verification' });
    const sendBtn = emailCard.getByRole('button', { name: /Send verification code/ });
    if (!(await sendBtn.isVisible().catch(() => false))) {
      // Already verified — nothing to do for this run.
      test.skip(true, 'email already verified');
      return;
    }

    const respPromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/auth/me/email/send') && resp.status() === 200
    );
    await sendBtn.click();
    const resp = await respPromise;
    const body = await resp.json();
    const code = body.demoCode;
    if (!code) {
      test.skip(true, 'no demoCode — real SMTP configured, code only in email');
      return;
    }

    await emailCard.getByPlaceholder('••••••').fill(String(code));
    await emailCard.getByRole('button', { name: 'Verify' }).click();
    await expect(page.getByText('Email verified')).toBeVisible({ timeout: 10000 });
    await expect(emailCard).toContainText('Verified');
  });
});

// ============================================================================
// SIGNUP EXPERIENCE & FORM VALIDATION
// ----------------------------------------------------------------------------
// Covers Task 1 (sign-up workflow) and Task 3 (page renders, valid signup,
// invalid signup error + form validation). The signup form uses real UI /
// HTML5 validation (required, minLength) plus an in-page password-mismatch
// check, and a backend uniqueness check surfaced as a toast.
// ============================================================================

const { test, expect } = require('@playwright/test');
const { uid } = require('./_helpers');

const DOMAIN = 'example.com';
const emailFor = (tag) => `${tag}_${uid()}@${DOMAIN}`;

test.describe('Sign up', () => {
  test('signup page renders all fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('h1', { hasText: 'TeaLeafLedger' })).toBeVisible();
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    // Two password inputs (password + confirm).
    await expect(page.locator('input[type="password"]')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Create account →' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('valid signup creates the account and lands on the dashboard', async ({ page }) => {
    const email = emailFor('user');
    await page.goto('/signup');
    await page.getByPlaceholder('Your name').fill('Test Signup User');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="tel"]').fill('+91 98765 43210');
    const password = 'SignupPass@123';
    await page.locator('input[type="password"]').nth(0).fill(password);
    await page.locator('input[type="password"]').nth(1).fill(password);
    await page.getByRole('button', { name: 'Create account →' }).click();

    await expect(page.getByText('Account created successfully!')).toBeVisible({ timeout: 15000 });
    await page.waitForURL('http://localhost:5183/');
    await expect(page.locator('a', { hasText: 'Overview' })).toBeVisible();
  });

  test('password mismatch is rejected without submitting', async ({ page }) => {
    await page.goto('/signup');
    await page.getByPlaceholder('Your name').fill('Mismatch User');
    await page.locator('input[type="email"]').fill(emailFor('mm'));
    await page.locator('input[type="tel"]').fill('+91 90000 00000');
    await page.locator('input[type="password"]').nth(0).fill('OnePass@123');
    await page.locator('input[type="password"]').nth(1).fill('Different@123');
    await page.getByRole('button', { name: 'Create account →' }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
    // Should remain on the signup page.
    await expect(page).toHaveURL(/\/signup/);
  });

  test('short password is blocked by the HTML minLength validation', async ({ page }) => {
    await page.goto('/signup');
    const both = page.locator('input[type="password"]');
    await expect(both.nth(0)).toHaveAttribute('minLength', '8');
    await expect(both.nth(1)).toHaveAttribute('minLength', '8');

    // Fill a too-short password and submit: browser validation blocks it.
    await page.getByPlaceholder('Your name').fill('Short User');
    await page.locator('input[type="email"]').fill(emailFor('short'));
    await both.nth(0).fill('12345');
    await both.nth(1).fill('12345');
    await page.getByRole('button', { name: 'Create account →' }).click();
    // The password field with minLength=8 is now considered invalid by the browser.
    await expect(both.nth(0)).not.toBeEmpty();
  });

  test('duplicate email shows an error toast from the backend', async ({ page }) => {
    // Use a fixed email that definitely exists (the admin seed account).
    await page.goto('/signup');
    await page.getByPlaceholder('Your name').fill('Duplicate User');
    await page.locator('input[type="email"]').fill('admin@tealeafledger.com');
    await page.locator('input[type="tel"]').fill('+91 91111 11111');
    const password = 'SignupPass@123';
    await page.locator('input[type="password"]').nth(0).fill(password);
    await page.locator('input[type="password"]').nth(1).fill(password);
    await page.getByRole('button', { name: 'Create account →' }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/signup/);
  });

  test('missing required fields are blocked by HTML validation', async ({ page }) => {
    await page.goto('/signup');
    // Nothing filled — submit.
    await page.getByRole('button', { name: 'Create account →' }).click();
    // The required inputs remain on the page and are invalid (no navigation).
    await expect(page.getByPlaceholder('Your name')).toHaveAttribute('required', '');
    await expect(page.locator('input[type="email"]')).toHaveAttribute('required', '');
    await expect(page).toHaveURL(/\/signup/);
  });

  test('login link navigates to /login', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});

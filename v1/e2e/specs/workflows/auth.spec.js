// ============================================================================
// AUTH & ROLE-ACCESS WORKFLOWS
// ----------------------------------------------------------------------------
// 1. The sign-in experience (page renders, valid login, invalid login error).
// 2. Role-based access control: MANAGER and ACCOUNTANT must not see ADMIN-only
//    modules, and direct URLs to those pages must bounce them back to "/".
// ============================================================================

const { test, expect } = require('@playwright/test');
const { login } = require('./_helpers');

test.describe('Sign in', () => {
  test('login page renders all fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1', { hasText: 'TeaLeafLedger' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]', { hasText: 'Login' })).toBeVisible();
  });

  test('wrong password shows an error toast', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@tealeafledger.com');
    await page.locator('input[type="password"]').fill('definitely-wrong');
    await page.locator('button[type="submit"]').click();
    // The error is shown as a toast (react-hot-toast) — match on "Invalid".
    await expect(page.getByText(/Invalid/i)).toBeVisible({ timeout: 10000 });
  });

  test('forgot password link navigates to /forgot-password', async ({ page }) => {
    await page.goto('/login');
    const link = page.getByRole('link', { name: 'Forgot password?' });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.locator('h2', { hasText: 'Forgot password?' })).toBeVisible();
  });
});

test.describe('Role-based access', () => {
  // MANAGER can use the business modules and change the day status, but must
  // never see the ADMIN-only Users / Roles & privileges entries.
  test('manager is redirected away from /privileges', async ({ page }) => {
    await login(page, 'manager@tealeafledger.com', 'Admin@123');
    await expect(page.locator('a', { hasText: 'Roles & privileges' })).toHaveCount(0);
    await expect(page.locator('a', { hasText: 'Users' })).toHaveCount(0);
    await expect(page.locator('a', { hasText: 'Farmers' })).toBeVisible();

    // Direct navigation must bounce back to the dashboard (ModuleRoute guard).
    await page.goto('/privileges');
    await page.waitForURL('http://localhost:5183/');
    await expect(page).toHaveURL('http://localhost:5183/');
  });

  test('accountant sees only the modules granted to the ACCOUNTANT role', async ({ page }) => {
    await login(page, 'accountant@tealeafledger.com', 'Admin@123');
    await expect(page.locator('a', { hasText: 'Farmers' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Payments & advances' })).toBeVisible();
    // Accountant has no RATES / DELIVERIES / USERS access by default.
    await expect(page.locator('a', { hasText: 'Rate management' })).toHaveCount(0);
    await expect(page.locator('a', { hasText: 'Users' })).toHaveCount(0);
  });
});

// test signup workflow
test.describe('Sign up', () => {
  test('sign up page renders all fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('h1', { hasText: 'TeaLeafLedger' })).toBeVisible();
    await expect(page.locator('input[type="fullname"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]', { hasText: 'Login' })).toBeVisible();
  });

  test('wrong password shows an error toast', async ({ page }) => {
    await page.goto('/signup');
    await page.locator('input[type="email"]').fill('kamaleshsivaraj@outlook.com');
    await page.locator('input[type="password"]').fill('definitely-wrong');
    await page.locator('button[type="submit"]').click();
    // The error is shown as a toast (react-hot-toast) — match on "Invalid".
    await expect(page.getByText(/Invalid/i)).toBeVisible({ timeout: 10000 });
  });
});
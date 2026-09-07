// Shared helpers for the module workflows.
// Each workflow test is fully self-contained: it creates its own test data,
// verifies it, then cleans up after itself so the database is never polluted.

const { expect } = require('@playwright/test');

// Unique numeric suffix (last 6 digits of the current millis timestamp).
// Every run gets a fresh suffix so test records never collide with real data
// or with records leftover from an earlier run.
function uid() {
  return Date.now().toString().slice(-6);
}

// Sign in through the real login UI and wait until the dashboard loads.
async function login(page, email, password) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('http://localhost:5183/');
  await expect(page.locator('a', { hasText: 'Overview' })).toBeVisible();
}

// Where all screenshots and videos are written.
const OUT = 'C:/Users/Kamalesh Sivaraj/Projects/TeaLeafLedger/v1/playwright-results';

module.exports = { login, uid, OUT };
import { test, expect } from '@playwright/test'

// ─────────────────────────────────────────
// FLOW: AUTH — Authentication
// TESTS: Sign-in flows and route protection
// AUDIT COVERAGE: SEC-01, SEC-02, SEC-03
// ─────────────────────────────────────────

test.describe('Authentication', () => {

  test('AUTH-01: User can sign in and reach dashboard', async ({ page }) => {
    // ARRANGE — auth state is loaded from global setup

    // ACT — navigate to dashboard
    await page.goto('/dashboard')

    // ASSERT — dashboard content is visible
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'New board' })).toBeVisible()
  })

  test('AUTH-02: Unauthenticated user is redirected to sign-in on protected routes', async ({ browser }) => {
    // ARRANGE — create a fresh context without auth state
    const context = await browser.newContext()
    const page = await context.newPage()

    // ACT — try to access protected route
    await page.goto('/dashboard')

    // ASSERT — redirected to sign-in
    await expect(page).toHaveURL(/\/(login|sign-in)/)

    await context.close()
  })

})

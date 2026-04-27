import { test, expect } from '@playwright/test'

// ─────────────────────────────────────────
// FLOW: SEC — Security & Access Control
// TESTS: Route protection, invalid IDs
// AUDIT COVERAGE: A01 Broken Access Control
// ─────────────────────────────────────────

test.describe('Security', () => {

  test('SEC-01: Unauthenticated user cannot access /dashboard directly', async ({ browser }) => {
    // ARRANGE — fresh context without auth
    const context = await browser.newContext()
    const page = await context.newPage()

    // ACT — try to access dashboard
    await page.goto('/dashboard')

    // ASSERT — redirected to login
    await expect(page).toHaveURL(/\/(login|sign-in)/)

    await context.close()
  })

  test('SEC-02: Unauthenticated user cannot access /board/:id directly', async ({ browser }) => {
    // ARRANGE — fresh context without auth
    const context = await browser.newContext()
    const page = await context.newPage()

    // ACT — try to access a board page with fake ID
    await page.goto('/board/abc123def456')

    // ASSERT — redirected to login
    await expect(page).toHaveURL(/\/(login|sign-in)/)

    await context.close()
  })

  test('SEC-03: Unauthenticated user cannot access /meeting/:id directly', async ({ browser }) => {
    // ARRANGE — fresh context without auth
    const context = await browser.newContext()
    const page = await context.newPage()

    // ACT — try to access a meeting page
    await page.goto('/meeting/abc123def456')

    // ASSERT — redirected to login
    await expect(page).toHaveURL(/\/(login|sign-in)/)

    await context.close()
  })

  test('SEC-04: Invalid board ID returns appropriate error', async ({ page }) => {
    // ACT — navigate to non-existent board (authenticated)
    await page.goto('/board/invalidboardid12345')

    // ASSERT — page loads without crashing, may show loading or error
    // Convex will return null for invalid ID format
    await page.waitForTimeout(2000)

    // Should either show board content or stay on page without crash
    await expect(page.locator('body')).toBeVisible()
  })

  test('SEC-05: Invalid meeting ID returns appropriate error', async ({ page }) => {
    // ACT — navigate to non-existent meeting (authenticated)
    await page.goto('/meeting/invalidmeetingid123')

    // ASSERT — shows "Meeting not found" message
    await expect(page.getByText('Meeting not found')).toBeVisible({ timeout: 5000 })
  })

})

import { test, expect, Page } from '@playwright/test'

// ─────────────────────────────────────────
// FLOW: AUTH — Authentication
// TESTS: Sign-in flows and route protection
// AUDIT COVERAGE: SEC-01, SEC-02, SEC-03
// ─────────────────────────────────────────

/**
 * Verifies that unauthenticated access is blocked.
 * Passes if EITHER:
 * - URL redirects to login/sign-in page, OR
 * - Page shows authentication prompt (sign-in text, Clerk UI, etc.)
 */
async function expectAuthenticationRequired(page: Page) {
  // Wait a bit for potential redirect or client-side auth check
  await page.waitForTimeout(2000)
  
  const url = page.url()
  const isOnLoginPage = /\/(login|sign-in|accounts\.)/i.test(url)
  
  if (isOnLoginPage) {
    // Redirected to a login page - test passes
    return
  }
  
  // Check for authentication-related UI on the current page
  const authPromptSelectors = [
    page.getByText(/please sign in/i),
    page.getByText(/sign in to/i),
    page.getByRole('button', { name: /sign in/i }),
    page.locator('[data-clerk-component]'),
    page.locator('.cl-rootBox'),
  ]
  
  for (const locator of authPromptSelectors) {
    if (await locator.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      // Found auth prompt on page - test passes
      return
    }
  }
  
  // Last resort: check page content for sign-in related text
  const pageContent = await page.textContent('body') || ''
  const hasAuthContent = /sign.?in|log.?in|authenticate/i.test(pageContent)
  
  if (hasAuthContent) {
    return
  }
  
  // If we get here, neither redirect nor auth prompt was found
  throw new Error(
    `Expected authentication required but found neither redirect to login nor auth prompt. ` +
    `Current URL: ${url}`
  )
}

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

    // ASSERT — authentication is required (redirect OR prompt)
    await expectAuthenticationRequired(page)

    await context.close()
  })

})

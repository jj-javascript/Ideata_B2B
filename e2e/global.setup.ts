import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/user.json')

// #region agent log
async function debugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
) {
  await fetch('http://127.0.0.1:7378/ingest/5fe9cb86-3444-4989-ba13-69cc99b3fdb4', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '6b864a',
    },
    body: JSON.stringify({
      sessionId: '6b864a',
      runId: 'pre-fix',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
}
// #endregion

setup('global setup', async ({}) => {
  // #region agent log
  let setupOk = false
  try {
    await clerkSetup()
    setupOk = true
  } catch (e) {
    await debugLog('global.setup.ts:clerkSetup', 'clerkSetup threw', { err: String(e) }, 'H3')
    throw e
  }
  await debugLog('global.setup.ts:clerkSetup', 'clerkSetup finished', { ok: setupOk }, 'H3')
  // #endregion
})

setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL?.trim() ?? ''
  if (!email) {
    throw new Error('TEST_USER_EMAIL is required for Playwright sign-in')
  }
  if (!email.includes('+clerk_test')) {
    throw new Error(
      'Clerk test sign-in: TEST_USER_EMAIL must be a test address containing "+clerk_test" (e.g. user+clerk_test@example.com). ' +
        'Create this user in the Clerk dashboard with Email / Email code. See: https://clerk.com/docs/testing/test-emails-and-phones#email-addresses'
    )
  }

  // #region agent log
  await debugLog(
    'global.setup.ts:authenticate:start',
    'env for setup',
    {
      hasEmail: Boolean(email.length),
      hasSecretKey: Boolean(process.env.CLERK_SECRET_KEY?.length),
      hasPublishable: Boolean(process.env.CLERK_PUBLISHABLE_KEY?.length),
      signInStrategy: 'email_code' as const,
    },
    'H2'
  )
  // #endregion

  await page.goto('/')
  // #region agent log
  await debugLog('global.setup.ts:afterGotoRoot', 'url after /', { url: page.url() }, 'H1')
  // #endregion

  // #region agent log
  try {
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'email_code',
        identifier: email,
      },
    })
  } catch (e) {
    await debugLog('global.setup.ts:signIn', 'clerk.signIn threw', {
      err: e instanceof Error ? e.message : String(e),
    }, 'H4')
    throw e
  }
  await debugLog('global.setup.ts:signIn', 'clerk.signIn done', { url: page.url() }, 'H1')
  // #endregion

  await page.goto('/dashboard')
  // #region agent log
  await debugLog('global.setup.ts:afterGotoDash', 'url after goto /dashboard', { url: page.url() }, 'H1')
  // #endregion

  // #region agent log
  try {
    await page.waitForURL((u) => {
      try {
        return new URL(u).pathname === '/dashboard'
      } catch {
        return false
      }
    }, { timeout: 30_000 })
  } catch (e) {
    await debugLog('global.setup.ts:waitForURL', 'waitForURL failed', {
      url: page.url(),
      err: e instanceof Error ? e.message : String(e),
    }, 'H4')
    throw e
  }
  await debugLog('global.setup.ts:waitForURL', 'waitForURL ok', { url: page.url() }, 'H1')
  // #endregion

  await page.context().storageState({ path: authFile })
})

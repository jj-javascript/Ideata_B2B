import { clerk } from '@clerk/testing/playwright'
import { Page } from '@playwright/test'

/**
 * Test user email must be a Clerk test address (e.g. user+clerk_test@example.com).
 * The Playwright helper runs the same flow as the React `email_code` example and uses
 * the test OTP 424242 automatically. See: https://clerk.com/docs/testing/test-emails-and-phones#email-addresses
 */
export async function signIn(page: Page) {
  const email = process.env.TEST_USER_EMAIL?.trim() ?? ''
  if (!email) throw new Error('TEST_USER_EMAIL is required')
  if (!email.includes('+clerk_test')) {
    throw new Error('TEST_USER_EMAIL must include "+clerk_test" for test email sign-in')
  }
  await page.goto('/')
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'email_code',
      identifier: email,
    },
  })
}

export async function signOut(page: Page) {
  await clerk.signOut({ page })
}

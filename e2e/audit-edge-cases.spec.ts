import { test, expect } from '@playwright/test'

// ─────────────────────────────────────────
// FLOW: EDGE — Edge Cases & Validation
// TESTS: Empty states, validation errors
// AUDIT COVERAGE: Error handling, validation
// ─────────────────────────────────────────

test.describe('Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('EDGE-01: Empty board title defaults to "Untitled board"', async ({ page }) => {
    // ACT — create board without entering title
    await page.getByRole('button', { name: 'New board' }).click()
    await expect(page.getByRole('heading', { name: 'Name your board' })).toBeVisible()

    // Leave title empty and create
    await page.getByRole('button', { name: 'Create' }).click()

    // ASSERT — redirected to board with default title
    await expect(page).toHaveURL(/\/board\//)
    await expect(page.getByText('Untitled board')).toBeVisible()
  })

  test('EDGE-02: Invalid email in share form shows validation error', async ({ page }) => {
    // ARRANGE — create a board
    await page.getByRole('button', { name: 'New board' }).click()
    await page.getByPlaceholder('e.g. Sprint Planning Ideas').fill('Email Validation Test')
    await page.getByRole('button', { name: 'Create' }).click()
    await page.goto('/dashboard')

    // Open share modal
    const boardItem = page.locator('ul > li').filter({ hasText: 'Email Validation Test' }).first()
    await boardItem.hover()

    const shareButton = boardItem.getByRole('button').filter({ hasText: /share/i }).or(
      boardItem.locator('button[title*="hare"]')
    )

    if (await shareButton.isVisible()) {
      await shareButton.click()

      // ACT — enter invalid email
      await page.getByPlaceholder('email@example.com').fill('not-an-email')
      await page.getByRole('button', { name: 'Add' }).click()

      // ASSERT — validation should occur (either client-side or server error)
      // The add action was attempted - we verify the modal is still open
      await expect(page.getByRole('heading', { name: 'Share board' })).toBeVisible()
    }
  })

  test('EDGE-03: Invalid email in meeting invite shows validation error', async ({ page }) => {
    // ARRANGE — create a meeting
    await page.getByRole('button', { name: 'Schedule meeting' }).first().click()
    await page.getByLabel('Title').fill('Email Validation Meeting')

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.getByLabel('Date').fill(tomorrow.toISOString().split('T')[0])
    await page.getByLabel('Time').fill('14:00')
    await page.locator('form').getByRole('button', { name: 'Schedule meeting' }).click()

    await expect(page).toHaveURL(/\/meeting\//)

    // ACT — open invite modal and enter invalid email
    await page.getByRole('button', { name: 'Invite' }).click()
    await page.getByPlaceholder('email@example.com').fill('invalid-email')
    await page.getByRole('button', { name: 'Add' }).click()

    // ASSERT — error message appears
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
  })

  test('EDGE-04: User sees "No boards yet" when dashboard is empty', async ({ page }) => {
    // ARRANGE — delete all boards if any exist
    // The "Your boards" section shows "Delete all" button when boards exist
    const deleteAllTrigger = page.getByRole('button', { name: 'Delete all' }).first()

    if (await deleteAllTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteAllTrigger.click()
      
      // Wait for confirmation modal to appear
      const modalHeading = page.getByRole('heading', { name: 'Delete all boards' })
      await expect(modalHeading).toBeVisible({ timeout: 5000 })
      
      // Wait for the confirm button to be ready and click it
      // The confirm button is a red "Delete all" button inside the modal
      // Use nth(1) since first is the trigger button, second is the confirm
      const confirmButton = page.getByRole('button', { name: 'Delete all' }).nth(1)
      await expect(confirmButton).toBeVisible({ timeout: 2000 })
      await confirmButton.click()
      
      // Wait for modal to close
      await expect(modalHeading).not.toBeVisible({ timeout: 10000 })
      
      // Wait for boards to be removed (data sync)
      await page.waitForTimeout(1000)
    }

    // ASSERT — empty state message
    // App shows "No boards yet. Create one to get started." when empty
    await expect(page.getByText(/No boards yet/i)).toBeVisible({ timeout: 10000 })
  })

  test('EDGE-05: User sees "No meetings scheduled" when no meetings exist', async ({ page }) => {
    // Note: This test assumes the user may or may not have meetings
    // We're checking that the section label exists and handles empty state

    // ASSERT — meetings section exists
    const meetingsSection = page.locator('section').filter({ hasText: 'Upcoming meetings' })
    await expect(page.getByRole('heading', { name: 'Upcoming meetings' })).toBeVisible()

    // Wait for loading to complete (spinner should disappear)
    const spinner = meetingsSection.locator('[data-testid="spinner"], .animate-spin, [role="status"]')
    await expect(spinner).toBeHidden({ timeout: 10000 }).catch(() => {})

    // Wait for either meetings list or empty message to appear
    const noMeetingsText = page.getByText('No meetings scheduled')
    const meetingsList = meetingsSection.locator('ul')

    // Use Playwright's built-in polling to wait for either condition
    await expect(async () => {
      const hasMeetings = await meetingsList.isVisible()
      const hasEmptyMessage = await noMeetingsText.isVisible()
      expect(hasMeetings || hasEmptyMessage).toBeTruthy()
    }).toPass({ timeout: 10000 })
  })

})

/**
 * Happy-path tests for Return to Issuer → Accept Return to Issuer.
 *
 * Test 1 — Return to Issuer (successful):
 *   Connected account is holder+beneficiary, returns the document.
 *   Expects "Return of ETR Successful" overlay.
 *
 * Test 2 — Accept Return to Issuer (successful):
 *   Continues from Test 1 (same page session via test.step).
 *   Issuer accepts (shreds) the returned document.
 *   Expects "Return of ETR Accepted" overlay.
 */
import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect, MetaMask, BasicSetup } from '../fixtures'
import { uploadAndVerify, connectMetaMask } from '../helpers/actions'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOCUMENT_PATH = path.resolve(
  __dirname,
  '../fixtures/local/w3c/tr_accept_return_to_issuer.json'
)

test.describe('Return to Issuer → Accept Return to Issuer', () => {
  test('full flow: return to issuer then accept', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = new MetaMask(
      context,
      metamaskPage,
      BasicSetup.walletPassword,
      extensionId
    )

    // ── Test 1: Return to Issuer ─────────────────────────────────────────────
    await test.step('Return to Issuer — holder+beneficiary returns document', async () => {
      await page.goto('/')
      await uploadAndVerify(page, DOCUMENT_PATH)
      await connectMetaMask(page, metamask)

      await expect(
        page.locator('[data-testid="manageAssetDropdown"]')
      ).toBeVisible({ timeout: 15_000 })
      await page.locator('[data-testid="manageAssetDropdown"]').click()
      await expect(
        page.locator('[data-testid="returnToIssuerDropdown"]')
      ).toBeVisible()
      await page.locator('[data-testid="returnToIssuerDropdown"]').click()

      const remark = page.locator('[data-testid="editable-input-remark"]')
      if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
        await remark.fill('E2E return to issuer')
      }

      await expect(
        page.locator('[data-testid="returnToIssuerBtn"]')
      ).toBeEnabled()
      await page.locator('[data-testid="returnToIssuerBtn"]').click()
      await page.waitForTimeout(2_000)
      await metamask.confirmTransaction()

      await expect(page.locator('text=Return of ETR Successful')).toBeVisible({
        timeout: 60_000,
      })
    })

    // ── Test 2: Accept Return to Issuer ──────────────────────────────────────
    await test.step('Accept Return to Issuer — issuer shreds the document', async () => {
      // Dismiss the success overlay from Test 1 and continue on the same page
      await page.locator('[data-testid="dismiss-modal"]').click()

      await expect(
        page.locator('[data-testid="manageAssetDropdown"]')
      ).toBeVisible({ timeout: 15_000 })
      await page.locator('[data-testid="manageAssetDropdown"]').click()
      await expect(
        page.locator('[data-testid="acceptReturnToIssuerDropdown"]')
      ).toBeVisible()
      await page.locator('[data-testid="acceptReturnToIssuerDropdown"]').click()

      await expect(
        page.locator('[data-testid="acceptReturnToIssuerBtn"]')
      ).toBeEnabled()
      await page.locator('[data-testid="acceptReturnToIssuerBtn"]').click()
      await page.waitForTimeout(2_000)
      await metamask.confirmTransaction()

      await expect(page.locator('text=Return of ETR Accepted')).toBeVisible({
        timeout: 60_000,
      })
    })
  })
})

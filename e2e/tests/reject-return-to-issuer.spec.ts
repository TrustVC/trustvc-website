import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect, MetaMask, BasicSetup } from '../fixtures'
import { uploadAndVerify, connectMetaMask } from '../helpers/actions'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOCUMENT_PATH = path.resolve(
  __dirname,
  '../fixtures/local/w3c/tr_reject_return_to_issuer.json'
)

// The original holder+beneficiary who returned the document to the issuer.
// After rejection the document is restored back to these addresses.
const PREV_HOLDER = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' // Hardhat account #0
const PREV_OWNER = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' // Hardhat account #0

test.describe('Return to Issuer → Reject Return to Issuer', () => {
  test('full flow: return to issuer then reject', async ({
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

    // ── Step 1: Return to Issuer ─────────────────────────────────────────
    // Requires: connected account is BOTH holder AND beneficiary
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
        await remark.fill('E2E return to issuer before reject')
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

    // ── Step 2: Reject Return to Issuer ─────────────────────────────────
    // Continues on the same page — dismiss overlay, then reject.
    // Requires: RestorerRole on the Token Registry (Account #0 as deployer)
    await test.step('Reject Return to Issuer — restore document to original holder', async () => {
      await page.locator('[data-testid="dismiss-modal"]').click()

      await expect(
        page.locator('[data-testid="manageAssetDropdown"]')
      ).toBeVisible({ timeout: 15_000 })
      await page.locator('[data-testid="manageAssetDropdown"]').click()
      await expect(
        page.locator('[data-testid="rejectReturnToIssuerDropdown"]')
      ).toBeVisible()
      await page.locator('[data-testid="rejectReturnToIssuerDropdown"]').click()

      await expect(
        page.locator('[data-testid="rejectReturnToIssuerBtn"]')
      ).toBeEnabled()
      await page.locator('[data-testid="rejectReturnToIssuerBtn"]').click()
      await page.waitForTimeout(2_000)
      await metamask.confirmTransaction()

      await expect(page.locator('text=Return of ETR Rejected')).toBeVisible({
        timeout: 60_000,
      })

      // Verify the success dialog shows the addresses the document is restored to
      await expect(page.locator(`text=${PREV_HOLDER}`).first()).toBeVisible({
        timeout: 10_000,
      })
      await expect(page.locator(`text=${PREV_OWNER}`).first()).toBeVisible({
        timeout: 10_000,
      })
    })
    // ── Step 2: Accept Return to Issuer ─────────────────────────────────
    // Continues on the same page — dismiss overlay, then accept.
    // Requires: RestorerRole on the Token Registry (Account #0 as deployer)
  })
})

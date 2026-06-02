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
        await remark.fill('E2E return to issuer before accept')
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

    // ── Step 2: Accept Return to Issuer ─────────────────────────────────
    // Continues on the same page — dismiss overlay, then accept.
    // Requires: AccepterRole on the Token Registry (Account #0 as deployer)
    await test.step('Accept Return to Issuer — shred the returned document', async () => {
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

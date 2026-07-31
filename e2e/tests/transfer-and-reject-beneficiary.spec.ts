import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect, MetaMask, BasicSetup } from '../fixtures'
import {
  uploadAndVerify,
  connectMetaMask,
  switchMetaMaskAccount,
} from '../helpers/actions'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PREV_BENEFICIARY = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' // Hardhat account #0
const NEW_BENEFICIARY = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
const DOCUMENT_PATH = path.resolve(
  __dirname,
  '../fixtures/local/w3c/tr_transfer_beneficiary.json'
)

test.describe
  .serial('Transfer Beneficiary → Reject Transfer Beneficiary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const dismissBtn = page.locator('[data-testid="dismiss-modal"]')
    if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissBtn.click()
    }
  })

  // ── Test 1: Transfer Beneficiary ─────────────────────────────────────────
  test('Transfer Beneficiary — Account #0 transfers to Account #1', async ({
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

    await uploadAndVerify(page, DOCUMENT_PATH)
    await connectMetaMask(page, metamask)

    await expect(
      page.locator('[data-testid="manageAssetDropdown"]')
    ).toBeVisible({ timeout: 15_000 })
    await page.locator('[data-testid="manageAssetDropdown"]').click()
    await expect(
      page.locator('[data-testid="transferOwnerDropdown"]')
    ).toBeVisible()
    await page.locator('[data-testid="transferOwnerDropdown"]').click()

    await expect(
      page.locator('[data-testid="editable-input-owner"]')
    ).toBeVisible({ timeout: 10_000 })
    await page
      .locator('[data-testid="editable-input-owner"]')
      .fill(NEW_BENEFICIARY)

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E transfer beneficiary')
    }

    await expect(page.locator('[data-testid="transferBtn"]')).toBeEnabled()
    await page.locator('[data-testid="transferBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.confirmTransaction()

    await expect(page.locator('text=Transfer Owner Success')).toBeVisible({
      timeout: 60_000,
    })
    await expect(
      page.getByRole('dialog').getByText(NEW_BENEFICIARY, { exact: false })
    ).toBeVisible({ timeout: 10_000 })
  })

  // ── Test 2: Reject Transfer Beneficiary ──────────────────────────────────
  test('Reject Transfer Beneficiary — Account #1 rejects', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    await uploadAndVerify(page, DOCUMENT_PATH)
    await switchMetaMaskAccount(metamaskPage, extensionId, 'Account 2')

    const metamask = new MetaMask(
      context,
      metamaskPage,
      BasicSetup.walletPassword,
      extensionId
    )
    await connectMetaMask(page, metamask)

    await expect(
      page.locator('[data-testid="manageAssetDropdown"]')
    ).toBeVisible({ timeout: 15_000 })
    await page.locator('[data-testid="manageAssetDropdown"]').click()
    await expect(
      page.locator('[data-testid="rejectTransferOwnerDropdown"]')
    ).toBeVisible()
    await page.locator('[data-testid="rejectTransferOwnerDropdown"]').click()

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E reject beneficiary transfer')
    }

    await expect(
      page.locator('[data-testid="rejectTransferOwnerBtn"]')
    ).toBeEnabled()
    await page.locator('[data-testid="rejectTransferOwnerBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.confirmTransaction()

    await expect(page.locator('text=Ownership Rejection Success')).toBeVisible({
      timeout: 60_000,
    })
    await expect(
      page.getByRole('dialog').getByText(PREV_BENEFICIARY, { exact: false })
    ).toBeVisible({ timeout: 10_000 })
  })
})

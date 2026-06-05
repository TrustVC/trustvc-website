import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect, MetaMask, BasicSetup } from '../fixtures'
import {
  uploadAndVerify,
  connectMetaMask,
  switchMetaMaskAccount,
} from '../helpers/actions'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const NEW_OWNER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
const NEW_HOLDER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
const DOCUMENT_PATH = path.resolve(
  __dirname,
  '../fixtures/local/w3c/tr_transfer_owners.json'
)

test.describe.serial('Transfer Owners → Reject Transfer Owners', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const dismissBtn = page.locator('[data-testid="dismiss-modal"]')
    if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissBtn.click()
    }
  })

  // ── Test 1: Transfer Owners ──────────────────────────────────────────────
  test('Transfer Owners — Account #0 transfers both to Account #1', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    // await switchMetaMaskAccount(metamaskPage, extensionId, 'Account 1')

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
      page.locator('[data-testid="endorseTransferDropdown"]')
    ).toBeVisible()
    await page.locator('[data-testid="endorseTransferDropdown"]').click()

    await expect(
      page.locator('[data-testid="editable-input-owner"]')
    ).toBeVisible({ timeout: 10_000 })
    await page.locator('[data-testid="editable-input-owner"]').fill(NEW_OWNER)
    await expect(
      page.locator('[data-testid="editable-input-holder"]')
    ).toBeVisible({ timeout: 10_000 })
    await page.locator('[data-testid="editable-input-holder"]').fill(NEW_HOLDER)

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E transfer owners')
    }

    await expect(
      page.locator('[data-testid="endorseTransferBtn"]')
    ).toBeEnabled()
    await page.locator('[data-testid="endorseTransferBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.confirmTransaction()

    await expect(
      page.locator('text=Transfer Ownership/Holdership Success')
    ).toBeVisible({ timeout: 60_000 })
    // const dialog = page.getByRole('dialog')
    // await expect(dialog.getByText(NEW_OWNER, { exact: false })).toBeVisible({
    //   timeout: 10_000,
    // })
    // await expect(dialog.getByText(NEW_HOLDER, { exact: false })).toBeVisible({
    //   timeout: 10_000,
    // })
  })

  // ── Test 2: Reject Transfer Owners ──────────────────────────────────────
  test('Reject Transfer Owners — Account #1 rejects both', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    await switchMetaMaskAccount(metamaskPage, extensionId, 'Account 2')

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
      page.locator('[data-testid="rejectTransferOwnerHolderDropdown"]')
    ).toBeVisible()
    await page
      .locator('[data-testid="rejectTransferOwnerHolderDropdown"]')
      .click()

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E reject owners transfer')
    }

    await expect(
      page.locator('[data-testid="rejectTransferOwnerHolderBtn"]')
    ).toBeEnabled()
    await page.locator('[data-testid="rejectTransferOwnerHolderBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.confirmTransaction()

    await expect(
      page.locator('text=Holdership/Ownership Rejection Success')
    ).toBeVisible({
      timeout: 60_000,
    })
  })
})

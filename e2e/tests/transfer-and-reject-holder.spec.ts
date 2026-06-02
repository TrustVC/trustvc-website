import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect, MetaMask, BasicSetup } from '../fixtures'
import {
  uploadAndVerify,
  connectMetaMask,
  switchMetaMaskAccount,
} from '../helpers/actions'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PREV_HOLDER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' // Hardhat account #0
const NEW_HOLDER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Hardhat account #1
const DOCUMENT_PATH = path.resolve(
  __dirname,
  '../fixtures/local/w3c/tr_transfer_holder.json'
)

test.describe.serial('Transfer Holder → Reject Transfer Holder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const dismissBtn = page.locator('[data-testid="dismiss-modal"]')
    if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissBtn.click()
    }
  })

  // ── Test 1: Transfer Holder ──────────────────────────────────────────────
  test('Transfer Holder — Account #0 transfers to Account #1', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    // Ensure MetaMask is on Account #1 (= Hardhat account #0)
    await switchMetaMaskAccount(metamaskPage, extensionId, 'Account 1')

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
      page.locator('[data-testid="transferHolderDropdown"]')
    ).toBeVisible()
    await page.locator('[data-testid="transferHolderDropdown"]').click()

    await expect(
      page.locator('[data-testid="editable-input-holder"]')
    ).toBeVisible({ timeout: 10_000 })
    await page.locator('[data-testid="editable-input-holder"]').fill(NEW_HOLDER)

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E transfer holder')
    }

    await expect(page.locator('[data-testid="transferBtn"]')).toBeEnabled()
    await page.locator('[data-testid="transferBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.confirmTransaction()

    await expect(page.locator('text=Transfer Holder Success')).toBeVisible({
      timeout: 60_000,
    })
    await expect(
      page.getByRole('dialog').getByText(NEW_HOLDER, { exact: false })
    ).toBeVisible({ timeout: 10_000 })
  })

  // ── Test 2: Reject Transfer Holder ──────────────────────────────────────
  test('Reject Transfer Holder — Account #1 rejects', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    // Add Account #2 (= Hardhat account #1, the new holder) and switch to it
    await switchMetaMaskAccount(metamaskPage, extensionId, 'Account 2')

    const metamask = new MetaMask(
      context,
      metamaskPage,
      BasicSetup.walletPassword,
      extensionId
    )

    await uploadAndVerify(page, DOCUMENT_PATH)

    await page.locator('[data-testid="connectToWallet"]').click()
    await page
      .locator('[data-testid="connectToMetamask"]')
      .waitFor({ state: 'visible', timeout: 10_000 })
    await page.locator('[data-testid="connectToMetamask"]').click()
    await metamask.connectToDapp()
    await page
      .locator('[data-testid="connect-blockchain-continue"]')
      .waitFor({ state: 'visible', timeout: 15_000 })
    await page.locator('[data-testid="connect-blockchain-continue"]').click()

    await expect(
      page.locator('[data-testid="manageAssetDropdown"]')
    ).toBeVisible({ timeout: 15_000 })
    await page.locator('[data-testid="manageAssetDropdown"]').click()
    await expect(
      page.locator('[data-testid="rejectTransferHolderDropdown"]')
    ).toBeVisible()
    await page.locator('[data-testid="rejectTransferHolderDropdown"]').click()

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E reject holder transfer')
    }

    await expect(
      page.locator('[data-testid="rejectTransferHolderBtn"]')
    ).toBeEnabled()
    await page.locator('[data-testid="rejectTransferHolderBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.confirmTransaction()

    await expect(page.locator('text=Holder Rejection Success')).toBeVisible({
      timeout: 60_000,
    })
    await expect(
      page.getByRole('dialog').getByText(PREV_HOLDER, { exact: false })
    ).toBeVisible({ timeout: 10_000 })
  })
})

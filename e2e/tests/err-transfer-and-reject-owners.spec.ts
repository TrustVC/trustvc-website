/**
 * Error-path tests for Transfer Owners and Reject Transfer Owners flows.
 *
 * Section 1 — Transfer Owners fails:
 *   Test 1a: User rejects MetaMask → "Transfer Ownership/Holdership Failed" + "User Rejected Transaction"
 *   Test 1b: Contract reverts (hardhat_setCode '0xfd') → "Transfer Ownership/Holdership Failed" + error
 *
 * Section 2 — Reject Transfer Owners fails:
 *   Pre-condition: transfer owners to Account 2 first (creates a pending transfer).
 *   Test 2a: Account 2 opens Reject, rejects MetaMask → "Holdership/Ownership Rejection Failed" + "User Rejected Transaction"
 *   Test 2b: Account 2 opens Reject, contract reverts → "Holdership/Ownership Rejection Failed" + error
 */
import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect, MetaMask, BasicSetup } from '../fixtures'
import {
  uploadAndVerify,
  connectMetaMask,
  switchMetaMaskAccount,
  revokeMetamaskPermissions, hardhatRpc, hardhatRpcNode } from '../helpers/actions'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOCUMENT_PATH = path.resolve(
  __dirname,
  '../fixtures/local/w3c/tr_transfer_owners.json'
)
const PREVIOUS_OWNER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' // Hardhat account #0
const NEW_OWNER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Hardhat account #1
const NEW_HOLDER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // same account
const TOKEN_REGISTRY = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
const TOKEN_ID =
  'e363ffeecb561c940f74e01c6a4a21154ad91cf71eaba09ec1ba44dc32c204de'

/** Transfers both holder and beneficiary (owners) to Account 2 — setup for reject-owners tests. */
async function transferOwnersSuccess(
  page: import('@playwright/test').Page,
  metamask: MetaMask
) {
  await expect(page.locator('[data-testid="manageAssetDropdown"]')).toBeVisible(
    { timeout: 15_000 }
  )
  await page.locator('[data-testid="manageAssetDropdown"]').click()
  await page.locator('[data-testid="endorseTransferDropdown"]').click()
  await page
    .locator('[data-testid="editable-input-owner"]')
    .waitFor({ state: 'visible', timeout: 10_000 })
  await page.locator('[data-testid="editable-input-owner"]').fill(NEW_OWNER)
  await page
    .locator('[data-testid="editable-input-holder"]')
    .waitFor({ state: 'visible', timeout: 10_000 })
  await page.locator('[data-testid="editable-input-holder"]').fill(NEW_HOLDER)

  const remark = page.locator('[data-testid="editable-input-remark"]')
  if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
    await remark.fill('E2E transfer owners — setup for reject error test')
  }

  await page.locator('[data-testid="endorseTransferBtn"]').click()
  await page.waitForTimeout(2_000)
  await metamask.confirmTransaction()
  await expect(
    page.getByRole('heading', { name: 'Transfer Ownership/Holdership Success' })
  ).toBeVisible({ timeout: 60_000 })
  await page.locator('[data-testid="dismiss-modal"]').click()
}

// ── Section 1: Transfer Owners fails ────────────────────────────────────────
test.describe('Error — Transfer Owners (transaction fails)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows error when MetaMask transaction is rejected during transfer', async ({
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
    await page.locator('[data-testid="endorseTransferDropdown"]').click()
    await page
      .locator('[data-testid="editable-input-owner"]')
      .waitFor({ state: 'visible', timeout: 10_000 })
    await page.locator('[data-testid="editable-input-owner"]').fill(NEW_OWNER)
    await page
      .locator('[data-testid="editable-input-holder"]')
      .waitFor({ state: 'visible', timeout: 10_000 })
    await page.locator('[data-testid="editable-input-holder"]').fill(NEW_HOLDER)

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E transfer owners — reject TX')
    }

    await page.locator('[data-testid="endorseTransferBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.rejectTransaction()

    await expect(
      page.getByRole('heading', {
        name: 'Transfer Ownership/Holdership Failed',
      })
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('text=User Rejected Transaction')).toBeVisible({
      timeout: 10_000,
    })
  })

  test('shows contract-level error when blockchain reverts the transfer', async ({
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
    await page.locator('[data-testid="endorseTransferDropdown"]').click()
    await page
      .locator('[data-testid="editable-input-owner"]')
      .waitFor({ state: 'visible', timeout: 10_000 })
    await page.locator('[data-testid="editable-input-owner"]').fill(NEW_OWNER)
    await page
      .locator('[data-testid="editable-input-holder"]')
      .waitFor({ state: 'visible', timeout: 10_000 })
    await page.locator('[data-testid="editable-input-holder"]').fill(NEW_HOLDER)

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E transfer owners — contract revert')
    }

    await page.locator('[data-testid="endorseTransferBtn"]').click()
    await page.waitForTimeout(1_000)

    const snapshotId = (await hardhatRpc(page, 'evm_snapshot')) as string
    const ownerOfResult = (await hardhatRpc(page, 'eth_call', [
      { to: TOKEN_REGISTRY, data: '0x6352211e' + TOKEN_ID },
      'latest',
    ])) as string
    const titleEscrowAddress = '0x' + ownerOfResult.slice(-40)

    await hardhatRpc(page, 'hardhat_setCode', [titleEscrowAddress, '0xfd'])
    await metamask.confirmTransaction()
    await hardhatRpc(page, 'evm_revert', [snapshotId])

    await expect(
      page.getByRole('heading', {
        name: 'Transfer Ownership/Holdership Failed',
      })
    ).toBeVisible({ timeout: 30_000 })
    const dialog1 = page.getByRole('dialog')
    await expect(dialog1.getByText('Current Owner')).toBeVisible({
      timeout: 10_000,
    })
    await expect(dialog1.getByText('Current Holder')).toBeVisible({
      timeout: 10_000,
    })
    // Both owner and holder are same account — address appears twice in dialog
    await expect(
      dialog1.getByText(PREVIOUS_OWNER, { exact: false }).nth(0)
    ).toBeVisible({ timeout: 10_000 })
    await expect(
      dialog1.getByText(PREVIOUS_OWNER, { exact: false }).nth(1)
    ).toBeVisible({ timeout: 10_000 })
  })
})

// ── Section 2: Reject Transfer Owners fails ──────────────────────────────────
test.describe('Error — Reject Transfer Owners (transaction fails)', () => {
  // Snapshot before transferOwnersSuccess — reverted after the last test
  let sectionSnapshot: string

  test.beforeAll(async () => {
    sectionSnapshot = await hardhatRpcNode('evm_snapshot')
  })

  test.afterAll(async () => {
    await hardhatRpcNode('evm_revert', [sectionSnapshot])
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows error when MetaMask transaction is rejected during reject-owners', async ({
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
    await transferOwnersSuccess(page, metamask)

    // Switch to Account 2 (new pending holder+beneficiary), revoke old permissions, reconnect
    await switchMetaMaskAccount(metamaskPage, extensionId, 'Account 2')
    await revokeMetamaskPermissions(page, metamask)
    await page.goto('/')
    await uploadAndVerify(page, DOCUMENT_PATH)
    await connectMetaMask(page, metamask)

    await expect(
      page.locator('[data-testid="manageAssetDropdown"]')
    ).toBeVisible({ timeout: 15_000 })
    await page.locator('[data-testid="manageAssetDropdown"]').click()
    await page
      .locator('[data-testid="rejectTransferOwnerHolderDropdown"]')
      .click()

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E reject owners — reject TX')
    }

    await page.locator('[data-testid="rejectTransferOwnerHolderBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.rejectTransaction()

    await expect(
      page.getByRole('heading', {
        name: 'Holdership/Ownership Rejection Failed',
      })
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('text=User Rejected Transaction')).toBeVisible({
      timeout: 10_000,
    })
  })

  test('shows contract-level error when blockchain reverts reject-owners', async ({
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

    // Switch to Account 2, revoke old permissions, reconnect
    await switchMetaMaskAccount(metamaskPage, extensionId, 'Account 2')
    await revokeMetamaskPermissions(page, metamask)

    await uploadAndVerify(page, DOCUMENT_PATH)
    await connectMetaMask(page, metamask)

    await expect(
      page.locator('[data-testid="manageAssetDropdown"]')
    ).toBeVisible({ timeout: 15_000 })
    await page.locator('[data-testid="manageAssetDropdown"]').click()
    await page
      .locator('[data-testid="rejectTransferOwnerHolderDropdown"]')
      .click()

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E reject owners — contract revert')
    }

    await page.locator('[data-testid="rejectTransferOwnerHolderBtn"]').click()
    await page.waitForTimeout(1_000)

    const snapshotId = (await hardhatRpc(page, 'evm_snapshot')) as string
    const ownerOfResult = (await hardhatRpc(page, 'eth_call', [
      { to: TOKEN_REGISTRY, data: '0x6352211e' + TOKEN_ID },
      'latest',
    ])) as string
    const titleEscrowAddress = '0x' + ownerOfResult.slice(-40)

    await hardhatRpc(page, 'hardhat_setCode', [titleEscrowAddress, '0xfd'])
    await metamask.confirmTransaction()
    await hardhatRpc(page, 'evm_revert', [snapshotId])

    await expect(
      page.getByRole('heading', {
        name: 'Holdership/Ownership Rejection Failed',
      })
    ).toBeVisible({ timeout: 30_000 })
    const dialog2 = page.getByRole('dialog')
    await expect(dialog2.getByText('Current Owner')).toBeVisible({
      timeout: 10_000,
    })
    await expect(dialog2.getByText('Current Holder')).toBeVisible({
      timeout: 10_000,
    })
    // Both owner and holder are same account — address appears twice in dialog
    await expect(
      dialog2.getByText(NEW_OWNER, { exact: false }).nth(0)
    ).toBeVisible({ timeout: 10_000 })
    await expect(
      dialog2.getByText(NEW_HOLDER, { exact: false }).nth(1)
    ).toBeVisible({ timeout: 10_000 })
  })
})

/**
 * Error-path tests for Transfer Holder and Reject Transfer Holder flows.
 *
 * Section 1 — Transfer Holder fails:
 *   Test 1a: User rejects MetaMask → "Transfer Holder Failed" + "User Rejected Transaction"
 *   Test 1b: Contract reverts (hardhat_setCode '0xfd') → "Transfer Holder Failed" + error
 *
 * Section 2 — Reject Transfer Holder fails:
 *   Pre-condition: transfer holder to Account 2 first (creates a pending transfer).
 *   Test 2a: Account 2 opens Reject, rejects MetaMask → "Holder Rejection Failed" + "User Rejected Transaction"
 *   Test 2b: Account 2 opens Reject, contract reverts → "Holder Rejection Failed" + error
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
  '../fixtures/local/w3c/tr_transfer_holder.json'
)
const CURRENT_HOLDER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' // Hardhat account #0
const NEW_HOLDER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Hardhat account #1
const TOKEN_REGISTRY = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
const TOKEN_ID =
  'ecb542b947553af17be191b445d28133a7c9e74de54ea3e27373c8421ce8e8fd'

/** Successfully transfers holder to Account 2 — setup for reject-holder error tests. */
async function transferHolderSuccess(
  page: import('@playwright/test').Page,
  metamask: MetaMask
) {
  await expect(page.locator('[data-testid="manageAssetDropdown"]')).toBeVisible(
    { timeout: 15_000 }
  )
  await page.locator('[data-testid="manageAssetDropdown"]').click()
  await page.locator('[data-testid="transferHolderDropdown"]').click()
  await page
    .locator('[data-testid="editable-input-holder"]')
    .waitFor({ state: 'visible', timeout: 10_000 })
  await page.locator('[data-testid="editable-input-holder"]').fill(NEW_HOLDER)

  const remark = page.locator('[data-testid="editable-input-remark"]')
  if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
    await remark.fill('E2E transfer holder — setup for reject error test')
  }

  await page.locator('[data-testid="transferBtn"]').click()
  await page.waitForTimeout(2_000)
  await metamask.confirmTransaction()
  await expect(
    page.getByRole('heading', { name: 'Transfer Holder Success' })
  ).toBeVisible({ timeout: 60_000 })
  await page.locator('[data-testid="dismiss-modal"]').click()
}

// ── Section 1: Transfer Holder fails ────────────────────────────────────────
test.describe('Error — Transfer Holder (transaction fails)', () => {
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
    await page.locator('[data-testid="transferHolderDropdown"]').click()
    await page
      .locator('[data-testid="editable-input-holder"]')
      .waitFor({ state: 'visible', timeout: 10_000 })
    await page.locator('[data-testid="editable-input-holder"]').fill(NEW_HOLDER)

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E transfer holder — reject TX')
    }

    await page.locator('[data-testid="transferBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.rejectTransaction()

    await expect(
      page.getByRole('heading', { name: 'Transfer Holder Failed' })
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
    await page.locator('[data-testid="transferHolderDropdown"]').click()
    await page
      .locator('[data-testid="editable-input-holder"]')
      .waitFor({ state: 'visible', timeout: 10_000 })
    await page.locator('[data-testid="editable-input-holder"]').fill(NEW_HOLDER)

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E transfer holder — contract revert')
    }

    await page.locator('[data-testid="transferBtn"]').click()
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
      page.getByRole('heading', { name: 'Transfer Holder Failed' })
    ).toBeVisible({ timeout: 30_000 })
    await expect(
      page.getByRole('dialog').getByText(CURRENT_HOLDER, { exact: false })
    ).toBeVisible({ timeout: 10_000 })
  })
})

// ── Section 2: Reject Transfer Holder fails ──────────────────────────────────
test.describe('Error — Reject Transfer Holder (transaction fails)', () => {
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

  test('shows error when MetaMask transaction is rejected during reject-holder', async ({
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
    await transferHolderSuccess(page, metamask)

    // Switch to Account 2 (new pending holder), revoke old permissions, reconnect
    await switchMetaMaskAccount(metamaskPage, extensionId, 'Account 2')
    await revokeMetamaskPermissions(page, metamask)
    await page.goto('/')
    await uploadAndVerify(page, DOCUMENT_PATH)
    await connectMetaMask(page, metamask)

    await expect(
      page.locator('[data-testid="manageAssetDropdown"]')
    ).toBeVisible({ timeout: 15_000 })
    await page.locator('[data-testid="manageAssetDropdown"]').click()
    await page.locator('[data-testid="rejectTransferHolderDropdown"]').click()

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E reject holder — reject TX')
    }

    await page.locator('[data-testid="rejectTransferHolderBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.rejectTransaction()

    await expect(
      page.getByRole('heading', { name: 'Holder Rejection Failed' })
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('text=User Rejected Transaction')).toBeVisible({
      timeout: 10_000,
    })
  })

  test('shows contract-level error when blockchain reverts reject-holder', async ({
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
    await page.locator('[data-testid="rejectTransferHolderDropdown"]').click()

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E reject holder — contract revert')
    }

    await page.locator('[data-testid="rejectTransferHolderBtn"]').click()
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
      page.getByRole('heading', { name: 'Holder Rejection Failed' })
    ).toBeVisible({ timeout: 30_000 })
    await expect(
      page.getByRole('dialog').getByText(NEW_HOLDER, { exact: false })
    ).toBeVisible({ timeout: 10_000 })
  })
})

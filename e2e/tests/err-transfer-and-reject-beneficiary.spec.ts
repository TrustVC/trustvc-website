/**
 * Error-path tests for Reject Transfer Beneficiary.
 *
 * Pre-condition: the beneficiary must first be transferred to create a pending
 * transfer that can then be rejected. The connected account (new beneficiary)
 * rejects the incoming transfer.
 *
 * Test 1 — Failed Reject (MetaMask rejection):
 *   Transfers beneficiary successfully, then rejects the MetaMask TX on reject.
 *   Expects "Ownership Rejection Failed" + "User Rejected Transaction".
 *
 * Test 2 — Contract-level error on Reject Transfer Beneficiary:
 *   Transfers beneficiary, opens Reject form, waits for MetaMask popup,
 *   wipes the TitleEscrow code (hardhat_setCode → '0xfd'), then confirms.
 *   TX reverts → "Ownership Rejection Failed" + contract error message.
 *   Chain is restored via evm_revert.
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

// tr_transfer_beneficiary.json — connected account is holder+beneficiary
const DOCUMENT_PATH = path.resolve(
  __dirname,
  '../fixtures/local/w3c/tr_transfer_beneficiary.json'
)
const NEW_BENEFICIARY = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Hardhat account #1
const TOKEN_REGISTRY = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
const TOKEN_ID =
  'a358b0a7df13a1377a9ce8a082ccbe95c9fd700b8c0b764ca94375b44d8942a5'

/** Successfully transfers beneficiary to Account #1 — used as setup for reject tests. */
async function transferBeneficiary(
  page: import('@playwright/test').Page,
  metamask: MetaMask
) {
  await expect(page.locator('[data-testid="manageAssetDropdown"]')).toBeVisible(
    { timeout: 15_000 }
  )
  await page.locator('[data-testid="manageAssetDropdown"]').click()
  await page.locator('[data-testid="transferOwnerDropdown"]').click()
  await page
    .locator('[data-testid="editable-input-owner"]')
    .waitFor({ state: 'visible', timeout: 10_000 })
  await page
    .locator('[data-testid="editable-input-owner"]')
    .fill(NEW_BENEFICIARY)

  const remark = page.locator('[data-testid="editable-input-remark"]')
  if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
    await remark.fill('E2E transfer beneficiary — setup for reject error test')
  }

  await page.locator('[data-testid="transferBtn"]').click()
  await page.waitForTimeout(2_000)
  await metamask.confirmTransaction()
  await expect(
    page.getByRole('heading', { name: 'Transfer Owner Success' })
  ).toBeVisible({ timeout: 60_000 })
  await page.locator('[data-testid="dismiss-modal"]').click()
}

// ── Error — Transfer Beneficiary itself fails ────────────────────────────────
test.describe('Error — Transfer Beneficiary (transaction fails)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  // Test 1: MetaMask rejection during transfer
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
    await page.locator('[data-testid="transferOwnerDropdown"]').click()
    await page
      .locator('[data-testid="editable-input-owner"]')
      .waitFor({ state: 'visible', timeout: 10_000 })
    await page
      .locator('[data-testid="editable-input-owner"]')
      .fill(NEW_BENEFICIARY)

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E transfer beneficiary — reject TX')
    }

    await page.locator('[data-testid="transferBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.rejectTransaction()
    await expect(
      page.getByRole('heading', { name: 'Transfer Owner Failed' })
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('text=User Rejected Transaction')).toBeVisible({
      timeout: 10_000,
    })
  })

  // Test 2: Contract-level revert during transfer (hardhat_setCode → '0xfd')
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
    await page.locator('[data-testid="transferOwnerDropdown"]').click()
    await page
      .locator('[data-testid="editable-input-owner"]')
      .waitFor({ state: 'visible', timeout: 10_000 })
    await page
      .locator('[data-testid="editable-input-owner"]')
      .fill(NEW_BENEFICIARY)

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E transfer beneficiary — contract revert')
    }

    await page.locator('[data-testid="transferBtn"]').click()
    await page.waitForTimeout(1_000)

    // Snapshot → wipe TitleEscrow code → TX reverts → restore
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
      page.getByRole('heading', { name: 'Transfer Owner Failed' })
    ).toBeVisible({ timeout: 30_000 })
    await expect(
      page
        .getByRole('dialog')
        .getByText('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', {
          exact: false,
        })
    ).toBeVisible({
      timeout: 10_000,
    })
  })
})

test.describe('Error — Reject Transfer Beneficiary', () => {
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

  // ── Test 1: MetaMask rejection ──────────────────────────────────────────

  test('shows error when MetaMask transaction is rejected on reject-transfer-beneficiary', async ({
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
    await transferBeneficiary(page, metamask)

    // Switch MetaMask to Account 2 (the new pending beneficiary)
    await switchMetaMaskAccount(metamaskPage, extensionId, 'Account 2')

    await revokeMetamaskPermissions(page, metamask) // ensure we test the full connect + reject flow with Account 2

    // Reload and re-verify the document as Account 2
    await page.goto('/')
    await uploadAndVerify(page, DOCUMENT_PATH)
    await connectMetaMask(page, metamask)

    await expect(
      page.locator('[data-testid="manageAssetDropdown"]')
    ).toBeVisible({ timeout: 15_000 })
    await page.locator('[data-testid="manageAssetDropdown"]').click()
    await page.locator('[data-testid="rejectTransferOwnerDropdown"]').click()

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E reject transfer beneficiary — reject TX')
    }

    await page.locator('[data-testid="rejectTransferOwnerBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.rejectTransaction()

    await expect(
      page.getByRole('heading', { name: 'Ownership Rejection Failed' })
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('text=User Rejected Transaction')).toBeVisible({
      timeout: 10_000,
    })
  })

  // ── Test 2: Contract-level revert ──────────────────────────────────────
  test('shows contract-level error when blockchain reverts reject-transfer-beneficiary', async ({
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
    // Switch MetaMask to Account 2, revoke old permissions, reload and reconnect
    await switchMetaMaskAccount(metamaskPage, extensionId, 'Account 2')

    await uploadAndVerify(page, DOCUMENT_PATH)
    await connectMetaMask(page, metamask)

    await expect(
      page.locator('[data-testid="manageAssetDropdown"]')
    ).toBeVisible({ timeout: 15_000 })
    await page.locator('[data-testid="manageAssetDropdown"]').click()
    await page.locator('[data-testid="rejectTransferOwnerDropdown"]').click()

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E reject transfer beneficiary — contract revert')
    }

    await page.locator('[data-testid="rejectTransferOwnerBtn"]').click()
    await page.waitForTimeout(1_000) // let MetaMask popup appear

    // Snapshot then wipe TitleEscrow → TX reverts
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
      page.getByRole('heading', { name: 'Ownership Rejection Failed' })
    ).toBeVisible({ timeout: 30_000 })
    await expect(
      page
        .getByRole('dialog')
        .getByText('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', {
          exact: false,
        })
    ).toBeVisible({
      timeout: 10_000,
    })
  })
})

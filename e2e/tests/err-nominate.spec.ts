/**
 * Error-path tests for the Nominate Beneficiary flow.
 *
 * Pre-condition for nomination: account must be beneficiary but NOT holder,
 * so we transfer the holder to Account #1 first (same as nominate.spec.ts).
 *
 * Test 1 — Failed Nomination (MetaMask rejection):
 *   Transfers holder, opens Nominate, then rejects the MetaMask transaction.
 *   Expects "Nomination Failed" + "User Rejected Transaction".
 *
 * Test 2 — Contract-level error on Nomination:
 *   Transfers holder, snapshots chain, opens Nominate, reverts chain state
 *   so the nomination pre-condition is gone, then confirms in MetaMask.
 *   The contract reverts → "Nomination Failed" + contract error message.
 */
import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect, MetaMask, BasicSetup } from '../fixtures'
import { uploadAndVerify, connectMetaMask, hardhatRpc, hardhatRpcNode } from '../helpers/actions'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOCUMENT_PATH = path.resolve(
  __dirname,
  '../fixtures/local/w3c/tr_nominate.json'
)
const NEW_BENEFICIARY = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'

test.describe('Error — Nominate Beneficiary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  // ── Test 1: MetaMask rejection ──────────────────────────────────────────
  test('shows error overlay when MetaMask transaction is rejected', async ({
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
    await page
      .locator('[data-testid="nominateBeneficiaryHolderDropdown"]')
      .click()
    await page
      .locator('[data-testid="editable-input-owner"]')
      .waitFor({ state: 'visible', timeout: 10_000 })
    await page
      .locator('[data-testid="editable-input-owner"]')
      .fill(NEW_BENEFICIARY)

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E nominate — reject test')
    }

    await page.locator('[data-testid="nominationBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.rejectTransaction()

    await expect(
      page.getByRole('heading', { name: 'Nomination Failed' })
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('text=User Rejected Transaction')).toBeVisible({
      timeout: 10_000,
    })
  })

  // ── Test 2: Contract-level revert ──────────────────────────────────────
  test('shows contract-level error when blockchain reverts the nomination', async ({
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

    // Open Nominate form and fill it
    await expect(
      page.locator('[data-testid="manageAssetDropdown"]')
    ).toBeVisible({ timeout: 15_000 })
    await page.locator('[data-testid="manageAssetDropdown"]').click()
    await page
      .locator('[data-testid="nominateBeneficiaryHolderDropdown"]')
      .click()
    await page
      .locator('[data-testid="editable-input-owner"]')
      .waitFor({ state: 'visible', timeout: 10_000 })
    await page
      .locator('[data-testid="editable-input-owner"]')
      .fill(NEW_BENEFICIARY)

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E nominate — contract revert test')
    }

    await page.locator('[data-testid="nominationBtn"]').click()
    await page.waitForTimeout(1_000) // let MetaMask popup appear

    // Snapshot BEFORE wiping the contract — so we can restore afterward
    const snapshotId = (await hardhatRpc(page, 'evm_snapshot')) as string

    // Resolve TitleEscrow address by calling ownerOf(tokenId) on the token registry.
    // The TitleEscrow IS the owner of the token in V5.
    const TOKEN_REGISTRY = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
    const TOKEN_ID =
      'c028b0a92ed3283146ef0e35d2f15845d38d7d4b736b14d938b0500d97a8426d'
    const ownerOfResult = (await hardhatRpc(page, 'eth_call', [
      { to: TOKEN_REGISTRY, data: '0x6352211e' + TOKEN_ID },
      'latest',
    ])) as string
    // Result is a 32-byte ABI-encoded address — last 20 bytes
    const titleEscrowAddress = '0x' + ownerOfResult.slice(-40)

    // Replace TitleEscrow code with a single REVERT opcode (0xfd).
    // Empty '0x' is a no-op success; '0xfd' makes every call to this address revert.
    await hardhatRpc(page, 'hardhat_setCode', [titleEscrowAddress, '0xfd'])

    // User confirms in MetaMask → TX calls the now-empty TitleEscrow → reverts
    await metamask.confirmTransaction()

    // Restore the chain to the state before we wiped the contract
    await hardhatRpc(page, 'evm_revert', [snapshotId])

    await expect(
      page.getByRole('heading', { name: 'Nomination Failed' })
    ).toBeVisible({ timeout: 30_000 })
    await expect(
      page.locator('text=Document nomination failed. Please try again.')
    ).toBeVisible({ timeout: 10_000 })
  })
})

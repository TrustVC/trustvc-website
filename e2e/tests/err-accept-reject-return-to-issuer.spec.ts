/**
 * Error-path tests for Return to Issuer → Accept / Reject flows.
 *
 * Test 1 — Failed Return to Issuer:
 *   Initiates a return but rejects the MetaMask transaction.
 *   Expects "Return of ETR Failed" error overlay.
 *
 * Test 2 — Successful Return to Issuer (pre-condition for tests 3 & 4):
 *   Returns the document successfully. Overlay stays open for next step.
 *
 * Test 3 — Failed Accept Return to Issuer:
 *   Dismisses the success overlay, opens Accept, then rejects the transaction.
 *   Expects "Return of ETR Acceptance Failed" error overlay.
 *
 * Test 4 — Failed Reject Return to Issuer:
 *   Dismisses the error overlay, opens Reject, then rejects the transaction.
 *   Expects "Return of ETR Rejection Failed" error overlay.
 *
 * Tests 2-4 share the same page session (test.step) so blockchain state flows through.
 */
import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect, MetaMask, BasicSetup } from '../fixtures'
import {
  uploadAndVerify,
  connectMetaMask,
  hardhatRpc,
  hardhatRpcNode,
} from '../helpers/actions'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOCUMENT_PATH = path.resolve(
  __dirname,
  '../fixtures/local/w3c/tr_reject_return_to_issuer.json'
)

// ── Test 1: Failed Return to Issuer ────────────────────────────────────────
test.describe('Error — Return to Issuer (transaction rejected)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

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
    await expect(
      page.locator('[data-testid="returnToIssuerDropdown"]')
    ).toBeVisible()
    await page.locator('[data-testid="returnToIssuerDropdown"]').click()

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E error — return rejected')
    }

    await expect(
      page.locator('[data-testid="returnToIssuerBtn"]')
    ).toBeEnabled()
    await page.locator('[data-testid="returnToIssuerBtn"]').click()
    await page.waitForTimeout(2_000)

    // Reject the transaction in MetaMask
    await metamask.rejectTransaction()

    // Assert app error overlay title
    await expect(page.locator('text=Return of ETR Failed')).toBeVisible({
      timeout: 30_000,
    })
    // Assert MetaMask rejection error message in the overlay body
    await expect(page.locator('text=User Rejected Transaction')).toBeVisible({
      timeout: 10_000,
    })
  })
  /**
   * Contract-level error: the MetaMask TX is confirmed by the user but the
   * blockchain reverts it.
   *
   * Technique:
   *   1. Return document to issuer (success).
   *   2. Take an EVM snapshot of the returned state.
   *   3. Dismiss overlay, click Accept to open MetaMask confirmation.
   *   4. Revert the chain to BEFORE the return (evm_revert) — token is no
   *      longer in "returned" state.
   *   5. Confirm in MetaMask — TX executes but contract reverts because the
   *      pre-condition is no longer met.
   *   6. Assert "Return of ETR Acceptance Failed" + contract error message.
   */
  test('shows contract-level error when blockchain reverts the transaction', async ({
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

    // Step 1: Snapshot BEFORE the return — so we can revert back to this state later
    const snapshotId = (await hardhatRpc(page, 'evm_snapshot')) as string

    // Step 2: Return to issuer successfully
    await expect(
      page.locator('[data-testid="manageAssetDropdown"]')
    ).toBeVisible({ timeout: 15_000 })
    await page.locator('[data-testid="manageAssetDropdown"]').click()
    await page.locator('[data-testid="returnToIssuerDropdown"]').click()
    await page.locator('[data-testid="returnToIssuerBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.confirmTransaction()
    await expect(page.locator('text=Return of ETR Successful')).toBeVisible({
      timeout: 60_000,
    })

    // Step 3: Open the Accept form (UI shows it because token IS in returned state)
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
    await page.waitForTimeout(1_000) // let MetaMask popup appear

    // Step 4: Revert chain to BEFORE the return (snapshot was taken pre-return)
    // → token is no longer in "returned" state
    await hardhatRpc(page, 'evm_revert', [snapshotId])

    // Step 5: User confirms in MetaMask → TX executes → contract reverts
    await metamask.confirmTransaction()

    // Step 6: Assert contract-level error overlay
    await expect(
      page.locator('text=Return of ETR Acceptance Failed')
    ).toBeVisible({ timeout: 30_000 })
    await expect(
      page.locator(
        'text=Accept Return of ETR transaction failed. Document remains with issuer.'
      )
    ).toBeVisible({ timeout: 10_000 })
  })

  test('shows contract-level error on Reject Return to Issuer when blockchain reverts', async ({
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

    // Step 1: Snapshot BEFORE the return
    const snapshotId = (await hardhatRpc(page, 'evm_snapshot')) as string

    // Step 2: Return to issuer successfully
    await expect(
      page.locator('[data-testid="manageAssetDropdown"]')
    ).toBeVisible({ timeout: 15_000 })
    await page.locator('[data-testid="manageAssetDropdown"]').click()
    await page.locator('[data-testid="returnToIssuerDropdown"]').click()
    await page.locator('[data-testid="returnToIssuerBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.confirmTransaction()
    await expect(page.locator('text=Return of ETR Successful')).toBeVisible({
      timeout: 60_000,
    })

    // Step 3: Open the Reject form (UI shows it because token IS in returned state)
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
    await page.waitForTimeout(1_000)

    // Step 4: Revert chain to BEFORE the return → token no longer in returned state
    await hardhatRpc(page, 'evm_revert', [snapshotId])

    // Step 5: User confirms in MetaMask → TX executes → contract reverts
    await metamask.confirmTransaction()

    // Step 6: Assert contract-level error overlay
    await expect(
      page.locator('text=Return of ETR Rejection Failed')
    ).toBeVisible({ timeout: 30_000 })
    await expect(
      page.locator(
        'text=Reject Return of ETR transaction failed. Document remains with issuer.'
      )
    ).toBeVisible({ timeout: 10_000 })
  })
})

// ── Tests 2-4: Shared session ──────────────────────────────────────────────
test.describe('Errors — Accept & Reject Return to Issuer (transaction rejected)', () => {
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

  test('full flow: successful return → failed accept → failed reject', async ({
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

    // ── Test 2: Successful Return to Issuer ──────────────────────────────
    await test.step('Return to Issuer — successful (pre-condition)', async () => {
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
        await remark.fill('E2E return before error tests')
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

    // ── Test 3: Failed Accept Return to Issuer ───────────────────────────
    await test.step('Accept Return to Issuer — transaction rejected, shows error', async () => {
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

      // Reject the transaction in MetaMask
      await metamask.rejectTransaction()

      await expect(
        page.locator('text=Return of ETR Acceptance Failed')
      ).toBeVisible({ timeout: 30_000 })
      await expect(page.locator('text=User Rejected Transaction')).toBeVisible({
        timeout: 10_000,
      })
    })

    // ── Test 4: Failed Reject Return to Issuer ───────────────────────────
    await test.step('Reject Return to Issuer — transaction rejected, shows error', async () => {
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

      // Reject the transaction in MetaMask
      await metamask.rejectTransaction()

      await expect(
        page.locator('text=Return of ETR Rejection Failed')
      ).toBeVisible({ timeout: 30_000 })
      await expect(page.locator('text=User Rejected Transaction')).toBeVisible({
        timeout: 10_000,
      })
    })
  })
})

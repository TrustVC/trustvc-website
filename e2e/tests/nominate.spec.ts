import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect, MetaMask, BasicSetup } from '../fixtures'
import { uploadAndVerify, connectMetaMask } from '../helpers/actions'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const NEW_HOLDER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Hardhat account #1

const NEW_BENEFICIARY = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Hardhat account #1
const DOCUMENT_PATH = path.resolve(
  __dirname,
  '../fixtures/local/w3c/tr_nominate.json'
)

test.describe('Nominate Beneficiary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const dismissBtn = page.locator('[data-testid="dismiss-modal"]')
    if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissBtn.click()
    }
  })

  test('nominates a new beneficiary via MetaMask', async ({
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

    //transfer holder first to enable the nomination dropdown (only beneficiary role )
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

    const remarkHolder = page.locator('[data-testid="editable-input-remark"]')
    if (await remarkHolder.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remarkHolder.fill('E2E transfer holder')
    }

    await expect(page.locator('[data-testid="transferBtn"]')).toBeEnabled()
    await page.locator('[data-testid="transferBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.confirmTransaction()

    await expect(page.locator('text=Transfer Holder Success')).toBeVisible({
      timeout: 60_000,
    })
    await page.locator('[data-testid="dismiss-modal"]').click()

    // Open dropdown → Nominate Beneficiary
    await expect(
      page.locator('[data-testid="manageAssetDropdown"]')
    ).toBeVisible({ timeout: 15_000 })
    await page.locator('[data-testid="manageAssetDropdown"]').click()
    await expect(
      page.locator('[data-testid="nominateBeneficiaryHolderDropdown"]')
    ).toBeVisible()
    await page
      .locator('[data-testid="nominateBeneficiaryHolderDropdown"]')
      .click()

    // Fill in the new beneficiary address (role="Owner" in the form)
    await expect(
      page.locator('[data-testid="editable-input-owner"]')
    ).toBeVisible({ timeout: 10_000 })
    await page
      .locator('[data-testid="editable-input-owner"]')
      .fill(NEW_BENEFICIARY)

    const remark = page.locator('[data-testid="editable-input-remark"]')
    if (await remark.isVisible({ timeout: 2000 }).catch(() => false)) {
      await remark.fill('E2E nominate beneficiary')
    }

    // Submit nomination
    await expect(page.locator('[data-testid="nominationBtn"]')).toBeEnabled()
    await page.locator('[data-testid="nominationBtn"]').click()
    await page.waitForTimeout(2_000)
    await metamask.confirmTransaction()

    await expect(page.locator('text=Nomination Success')).toBeVisible({
      timeout: 60_000,
    })

    await expect(page.locator(`text=${NEW_BENEFICIARY}`)).toBeVisible({
      timeout: 60_000,
    })
  })
})

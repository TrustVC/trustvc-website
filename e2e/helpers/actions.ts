import type { Page } from '@playwright/test'
import { MetaMask } from '@synthetixio/synpress/playwright'

// Pages that already have the popover auto-dismiss handler registered.
const popoverHandlerRegistered = new WeakSet<Page>()

/**
 * Dismisses the MetaMask "What's new" popover and any other blocking popups.
 * MetaMask renders announcement popovers asynchronously after home.html
 * loads, so a one-shot visibility check can miss one that appears late and
 * then blocks every subsequent click. addLocatorHandler makes Playwright
 * auto-dismiss the popover whenever it shows up, including mid-action.
 */
async function dismissMetaMaskPopups(metamaskPage: Page) {
  const popoverClose = metamaskPage.locator('[data-testid="popover-close"]')

  if (!popoverHandlerRegistered.has(metamaskPage)) {
    popoverHandlerRegistered.add(metamaskPage)
    await metamaskPage.addLocatorHandler(popoverClose, async () => {
      await popoverClose.click()
    })
  }

  // Also dismiss immediately if it is already showing.
  if (await popoverClose.isVisible({ timeout: 3000 }).catch(() => false)) {
    await popoverClose.click()
    await metamaskPage.waitForTimeout(500)
  }
}

/**
 * Uploads a document, waits for verification, and asserts all three checks VALID.
 */
export async function uploadAndVerify(page: Page, documentPath: string) {
  // If a previous verify result is showing, click "Upload New File" to reset first
  const uploadNewFileBtn = page.locator('[data-testid="upload-new-file-btn"]')
  if (await uploadNewFileBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await uploadNewFileBtn.click()
  }

  // #file-upload has display:none — setInputFiles works on hidden inputs directly
  await page.locator('#file-upload').setInputFiles(documentPath)

  await page
    .locator('[data-testid="verifying-state"]')
    .waitFor({ state: 'visible', timeout: 30_000 })
  await page
    .locator('[data-testid="verifying-state"]')
    .waitFor({ state: 'hidden', timeout: 60_000 })

  await page
    .locator('[data-testid="verify-result"]')
    .waitFor({ state: 'visible', timeout: 15_000 })
  await page
    .locator('[data-testid="check-document_integrity"][data-status="VALID"]')
    .waitFor({ state: 'visible' })
  await page
    .locator('[data-testid="check-document_status"][data-status="VALID"]')
    .waitFor({ state: 'visible' })
  await page
    .locator('[data-testid="check-issuer_identity"][data-status="VALID"]')
    .waitFor({ state: 'visible' })
}

/**
 * Opens the connect wallet overlay, clicks Connect with MetaMask,
 * approves the connection popup, then clicks Continue.
 * Uses Promise.all to avoid the race condition where the popup appears
 * before connectToDapp() is listening.
 */
export async function connectMetaMask(page: Page, metamask: MetaMask) {
  // Unlock MetaMask if locked.
  const passwordInput = metamask.page.locator('[data-testid="unlock-password"]')
  if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await metamask.unlock()
  }

  // Dismiss "What's new" or any blocking popup on the MetaMask home page
  await dismissMetaMaskPopups(metamask.page)

  await page.locator('[data-testid="connectToWallet"]').click()
  await page
    .locator('[data-testid="connectToMetamask"]')
    .waitFor({ state: 'visible', timeout: 30_000 })

  // Start listening for the connection popup BEFORE clicking so we never miss it.
  const connectPromise = metamask.connectToDapp()
  await page.waitForTimeout(500)
  await page.locator('[data-testid="connectToMetamask"]').click()
  await connectPromise

  await page
    .locator('[data-testid="connect-blockchain-continue"]')
    .waitFor({ state: 'visible', timeout: 30_000 })
  await page.locator('[data-testid="connect-blockchain-continue"]').click()
}

/**
 * Switches MetaMask to the named account using synpress's built-in switchAccount.
 * accountName = 'Account 1' (Hardhat #0), 'Account 2' (Hardhat #1), etc.
 * Navigates back to home afterward so the extension is settled before the next
 * connectToDapp() call.
 */
export async function switchMetaMaskAccount(
  metamaskPage: Page,
  extensionId: string,
  accountName: string
) {
  await metamaskPage.goto(`chrome-extension://${extensionId}/home.html`)
  await metamaskPage.waitForLoadState('domcontentloaded')

  // Unlock if locked, then dismiss any blocking popups
  const pw = metamaskPage.locator('[data-testid="unlock-password"]')
  if (await pw.isVisible({ timeout: 3000 }).catch(() => false)) {
    await metamaskPage
      .locator('[data-testid="unlock-password"]')
      .fill('Tester@1234')
    await metamaskPage.locator('[data-testid="unlock-submit"]').click()
    await metamaskPage.waitForTimeout(1000)
  }
  await dismissMetaMaskPopups(metamaskPage)

  await metamaskPage.locator('[data-testid="account-menu-icon"]').click()

  // Find the account by name and click it
  const accountBtn = metamaskPage.locator(
    '.multichain-account-menu-popover__list .multichain-account-list-item__account-name__button',
    { hasText: accountName }
  )
  await accountBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await accountBtn.click()

  await metamaskPage.waitForTimeout(1000)
}

/**
 * Adds a new derived MetaMask account using synpress's built-in addNewAccount.
 * accountName = 'Account 2', 'Account 3', etc.
 */
export async function addMetaMaskAccount(
  metamaskPage: Page,
  extensionId: string,
  accountName: string
) {
  await metamaskPage.goto(`chrome-extension://${extensionId}/home.html`)
  await metamaskPage.waitForLoadState('domcontentloaded')

  await dismissMetaMaskPopups(metamaskPage)

  await metamaskPage.locator('[data-testid="account-menu-icon"]').click()
  await metamaskPage
    .locator('[data-testid="multichain-account-menu-popover-add-account"]')
    .click()
  await metamaskPage
    .locator(
      '[data-testid="multichain-account-menu-popover-add-derived-account"]'
    )
    .click()

  // Clear default name and type the desired account name
  const nameInput = metamaskPage.locator('[data-testid="account-name-field"]')
  if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await nameInput.clear()
    await nameInput.fill(accountName)
  }

  await metamaskPage
    .locator('[data-testid="submit-add-account-with-name"]')
    .click()
  await metamaskPage.waitForTimeout(5000)
}

const HARDHAT_RPC = 'http://127.0.0.1:8545'

/**
 * Calls a Hardhat JSON-RPC method from inside a test (uses page.evaluate / browser fetch).
 */
export async function hardhatRpc(page: Page, method: string, params: unknown[] = []) {
  return page.evaluate(
    async ([rpc, method, params]: [string, string, unknown[]]) => {
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
      })
      const data = (await res.json()) as { result?: unknown; error?: { message: string } }
      if (data.error) throw new Error(data.error.message)
      return data.result
    },
    [HARDHAT_RPC, method, params] as [string, string, unknown[]]
  )
}

/**
 * Calls a Hardhat JSON-RPC method from Node.js context (beforeAll / afterAll — no page available).
 */
export async function hardhatRpcNode(method: string, params: unknown[] = []) {
  const res = await fetch(HARDHAT_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  })
  const data = (await res.json()) as { result?: unknown; error?: { message: string } }
  if ((data as any).error) throw new Error((data as any).error.message)
  return data.result as string
}

export async function revokeMetamaskPermissions(
  page: Page,
  _metamask: MetaMask
) {
  // Revoke dapp permissions so the next connect uses Account 2 (not the cached Account 1)
  await page.evaluate(async () => {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }],
      })
    } catch {}
  })
}

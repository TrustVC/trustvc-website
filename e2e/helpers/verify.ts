import { type Page, expect } from '@playwright/test'

/**
 * Helpers for the verification (read-only) e2e tests — no MetaMask needed.
 *
 * The app renders one of two outcomes after verification completes:
 *   - isValid === true  → <VerifyResult>  with three green checks
 *   - isValid === false → <VerifyError>   overlay (generic; the UI does NOT
 *                          surface which of identity/status/integrity failed)
 * so happy paths assert the green checks, error paths assert the error overlay.
 */

const DOC_STORE = '0x057ef64E23666F000b34aE31332854aCBd1c8544' // setup-document-store.cjs (acct #3, nonce 0)
// Address with no contract — used by the *_contract_not_found fixtures (DNS lists it so
// identity passes, but there's no contract there → CONTRACT_NOT_FOUND).
const NO_CONTRACT = '0x000000000000000000000000000000000000bEEF'
const TOKEN_REGISTRY = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' // setup-contracts.cjs

/** Resets any prior result so a fresh file can be uploaded. */
async function resetIfNeeded(page: Page) {
  for (const sel of ['[data-testid="upload-new-file-btn"]', '[data-testid="try-another-btn"]']) {
    const btn = page.locator(sel)
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await btn.click()
      break
    }
  }
}

async function uploadAndWait(page: Page, documentPath: string) {
  await resetIfNeeded(page)
  // #file-upload is display:none — setInputFiles works on hidden inputs.
  await page.locator('#file-upload').setInputFiles(documentPath)
  await page.locator('[data-testid="verifying-state"]').waitFor({ state: 'visible', timeout: 30_000 })
  await page.locator('[data-testid="verifying-state"]').waitFor({ state: 'hidden', timeout: 60_000 })
}

/**
 * Upload a document and assert it verifies VALID: all three checks green AND the
 * document renderer mounts (template iframe). Pass renderer:false to skip the
 * renderer assertion (e.g. if the template host is unreachable in the env).
 */
export async function uploadAndExpectValid(
  page: Page,
  documentPath: string,
  { renderer = true, template }: { renderer?: boolean; template?: string } = {}
) {
  await uploadAndWait(page, documentPath)
  await page.locator('[data-testid="verify-result"]').waitFor({ state: 'visible', timeout: 15_000 })
  for (const type of ['document_integrity', 'document_status', 'issuer_identity']) {
    await page
      .locator(`[data-testid="check-${type}"][data-status="VALID"]`)
      .waitFor({ state: 'visible' })
  }
  if (renderer) {
    await page.locator('[data-testid="document-renderer"]').waitFor({ state: 'visible', timeout: 15_000 })
    // FrameConnector mounts the template iframe...
    await page.locator('[data-testid="document-renderer"] iframe').waitFor({ state: 'attached', timeout: 15_000 })
    // ...and data-renderer-ready flips to "true" only once the template has actually
    // rendered (the renderer posts its ready/height signal back). Needs internet to
    // reach the template host (generic-templates.tradetrust.io).
    await page
      .locator('[data-testid="document-renderer"][data-renderer-ready="true"]')
      .waitFor({ state: 'attached', timeout: 30_000 })
    // "Rendered View: <TEMPLATE> rendered from …" — confirms which template rendered.
    if (template) {
      await expect(page.locator('[data-testid="rendered-view"]')).toContainText(template, {
        timeout: 15_000,
      })
    }
  }
}

/**
 * Upload a document and assert it is rejected (VerifyError overlay shown). When
 * `expectedMessage` is given, also assert the recovery message (body) contains
 * it — this is the category-specific explanation under the title.
 */
export async function uploadAndExpectInvalid(
  page: Page,
  documentPath: string,
  expectedMessage?: string
) {
  await uploadAndWait(page, documentPath)
  await page.locator('[data-testid="error-message"]').waitFor({ state: 'visible', timeout: 15_000 })
  if (expectedMessage) {
    await expect(page.locator('[data-testid="recovery-message"]')).toContainText(expectedMessage, {
      timeout: 5_000,
    })
  }
}

/**
 * Mocks the in-browser DNS-over-HTTPS lookups (dns.google / cloudflare-dns) so a
 * local-chain document store / token registry resolves a valid DNS-TXT identity
 * under `domain`. Other domains fall through to real DNS.
 */
export async function mockIssuerDns(page: Page, domain = 'issuer.example') {
  const answer = {
    Status: 0,
    Answer: [
      { name: domain, type: 16, TTL: 3600, data: `openatts net=ethereum netId=1337 addr=${DOC_STORE}` },
      { name: domain, type: 16, TTL: 3600, data: `openatts net=ethereum netId=1337 addr=${TOKEN_REGISTRY}` },
      { name: domain, type: 16, TTL: 3600, data: `openatts net=ethereum netId=1337 addr=${NO_CONTRACT}` },
    ],
  }
  await page.route(/(dns\.google|cloudflare-dns\.com)/, async route => {
    const url = route.request().url()
    if (url.includes(encodeURIComponent(domain)) || url.includes(domain)) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(answer) })
    } else {
      await route.continue()
    }
  })
}

/** Mocks the OCSP responder to report the document as revoked. */
export async function mockOcspRevoked(page: Page, host = 'ocsp.example.com') {
  await page.route(new RegExp(host.replace('.', '\\.')), async route => {
    const hash = route.request().url().split('/').pop()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ revoked: true, documentHash: hash, reasonCode: 1 }),
    })
  })
}

/** Mocks the OCSP responder to report the document as NOT revoked. */
export async function mockOcspNotRevoked(page: Page, host = 'ocsp.example.com') {
  await page.route(new RegExp(host.replace('.', '\\.')), async route => {
    const hash = route.request().url().split('/').pop()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ revoked: false, documentHash: hash }),
    })
  })
}

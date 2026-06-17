import path from 'path'
import { fileURLToPath } from 'url'
import { test } from '@playwright/test'
import { uploadAndExpectValid, uploadAndExpectInvalid } from '../helpers/verify'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fix = (name: string) => path.resolve(__dirname, '../fixtures/local/w3c', name)

/**
 * W3C Verifiable Credential verification flows (read-only — no MetaMask).
 * Issuer identity resolves via did:web:trustvc.github.io (requires internet).
 * The token-registry case checks the local Hardhat registry deployed by
 * setup-contracts.cjs (its auto-generated token is never minted → not-minted).
 */
test.describe('W3C VC verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const dismiss = page.locator('[data-testid="dismiss-modal"]')
    if (await dismiss.isVisible({ timeout: 2000 }).catch(() => false)) await dismiss.click()
  })

  // ── Happy ────────────────────────────────────────────────────────────────
  test('DID:WEB verifiable document (ecdsa-sd-2023) → valid', async ({ page }) => {
    await uploadAndExpectValid(page, fix('w3c_vc_didweb_ecdsa_valid.json'), { template: 'CHAFTA' })
  })

  test('DID:WEB verifiable document (bbs-2023) → valid', async ({ page }) => {
    await uploadAndExpectValid(page, fix('w3c_vc_didweb_bbs2023_valid.json'), { template: 'CHAFTA' })
  })

  test('bitstring status list not revoked → valid', async ({ page }) => {
    await uploadAndExpectValid(page, fix('w3c_vc_didweb_ecdsa_bitstring_not_revoked.json'), { template: 'CHAFTA' })
  })

  test('TransferableRecords minted → valid', async ({ page }) => {
    await uploadAndExpectValid(page, fix('w3c_tr_didweb_ecdsa_tokenregistry_valid.json'), { template: 'CHAFTA' })
  })

  // ── Document status errors ─────────────────────────────────────────────────
  test('bitstring status list revoked → invalid', async ({ page }) => {
    await uploadAndExpectInvalid(page, fix('w3c_vc_didweb_ecdsa_bitstring_revoked.json'), 'has been revoked by the issuing authority')
  })

  // For W3C TransferableRecords status failures the UI shows the verifier's own reason
  // verbatim as the recovery message (the error type stays the generic INVALID, so the
  // title is unchanged) — see getErrorMessageFromFragments.
  test('token registry not minted → invalid', async ({ page }) => {
    await uploadAndExpectInvalid(page, fix('w3c_tr_didweb_ecdsa_tokenregistry_not_minted.json'), 'Document has not been issued under token registry')
  })

  test('token registry contract not deployed → invalid', async ({ page }) => {
    await uploadAndExpectInvalid(page, fix('w3c_tr_didweb_ecdsa_tokenregistry_no_contract.json'), 'Token registry is not found')
  })

  // ── Document integrity errors ──────────────────────────────────────────────
  test('ECDSA2023 tampered → invalid', async ({ page }) => {
    await uploadAndExpectInvalid(page, fix('w3c_vc_didweb_ecdsa_tampered.json'), 'inaccurate and have been tampered with')
  })

  test('BBS2023 tampered → invalid', async ({ page }) => {
    await uploadAndExpectInvalid(page, fix('w3c_vc_didweb_bbs2023_tampered.json'), 'inaccurate and have been tampered with')
  })

  // ── Issuer identity error ──────────────────────────────────────────────────
  // Validly signed, but issuer (did:…:999) ≠ proof.verificationMethod (did:…:1),
  // so the signature stays valid (integrity green) while the issuer identity fails.
  test('DID:WEB issuer identity invalid → invalid', async ({ page }) => {
    await uploadAndExpectInvalid(page, fix('w3c_vc_didweb_ecdsa_identity_invalid.json'), 'issued by an invalid issuer')
  })
})

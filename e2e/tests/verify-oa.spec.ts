import path from 'path'
import { fileURLToPath } from 'url'
import { test } from '@playwright/test'
import {
  uploadAndExpectValid,
  uploadAndExpectInvalid,
  mockIssuerDns,
  mockOcspRevoked,
  mockOcspNotRevoked,
} from '../helpers/verify'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fix = (name: string) => path.resolve(__dirname, '../fixtures/local/oa', name)

/**
 * OpenAttestation v2 verification flows (read-only — no MetaMask).
 * Fixture naming: oa_v2_<identity>_<mechanism>_<outcome>.
 *
 * Identity resolution:
 *   - example.tradetrust.io → real DNS (live records) — DNS-DID happy/OCSP/revstore/tampered
 *   - demo-invalid-identity.tradetrust.io → real DNS, no record → identity fails
 *   - issuer.example → mocked (mockIssuerDns) → local store / registry on 1337
 * On-chain state: local Hardhat — doc store 0x057ef6… (setup-document-store.cjs),
 * token registry 0xe7f17… (setup-contracts.cjs).
 */
test.describe('OpenAttestation v2 verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const dismiss = page.locator('[data-testid="dismiss-modal"]')
    if (await dismiss.isVisible({ timeout: 2000 }).catch(() => false)) await dismiss.click()
  })

  // ── Happy ──────────────────────────────────────────────────────────────────
  test('DNS-DID → valid', async ({ page }) => {
    await uploadAndExpectValid(page, fix('oa_v2_dnsdid_valid.json'), { template: 'CHAFTA' })
  })

  test('DNS-TXT document store (issued) → valid', async ({ page }) => {
    await mockIssuerDns(page)
    await uploadAndExpectValid(page, fix('oa_v2_dnstxt_docstore_valid.json'), { template: 'CHAFTA' })
  })

  test('DNS-TXT token registry (minted) → valid', async ({ page }) => {
    await mockIssuerDns(page)
    await uploadAndExpectValid(page, fix('oa_v2_dnstxt_tokenregistry_valid.json'), { template: 'CHAFTA' })
  })

  // ── Issuer identity errors ─────────────────────────────────────────────────
  test('DNS-DID identity not found → invalid', async ({ page }) => {
    await uploadAndExpectInvalid(page, fix('oa_v2_dnsdid_identity_invalid.json'), 'issued by an invalid issuer')
  })

  test('DNS-TXT identity not found → invalid', async ({ page }) => {
    await uploadAndExpectInvalid(page, fix('oa_v2_dnstxt_identity_invalid.json'), 'issued by an invalid issuer')
  })

  // ── Document store status ──────────────────────────────────────────────────
  test('document store revoked → invalid', async ({ page }) => {
    await mockIssuerDns(page)
    await uploadAndExpectInvalid(page, fix('oa_v2_dnstxt_docstore_revoked.json'), 'has been revoked by the issuing authority')
  })

  test('document store not issued → invalid', async ({ page }) => {
    await mockIssuerDns(page)
    await uploadAndExpectInvalid(page, fix('oa_v2_dnstxt_docstore_not_issued.json'), 'This document cannot be found')
  })

  test('document store contract not deployed → invalid', async ({ page }) => {
    await mockIssuerDns(page)
    await uploadAndExpectInvalid(page, fix('oa_v2_dnstxt_docstore_no_contract.json'), 'misconfigured their Document store or Token registry address')
  })

  // ── Token registry status ──────────────────────────────────────────────────
  test('token registry not minted → invalid', async ({ page }) => {
    await mockIssuerDns(page)
    await uploadAndExpectInvalid(page, fix('oa_v2_dnstxt_tokenregistry_not_minted.json'), 'This document cannot be found')
  })

  test('token registry contract not deployed → invalid', async ({ page }) => {
    await mockIssuerDns(page)
    await uploadAndExpectInvalid(page, fix('oa_v2_dnstxt_tokenregistry_no_contract.json'), 'misconfigured their Document store or Token registry address')
  })

  // ── OCSP (DNS-DID) ─────────────────────────────────────────────────────────
  test('OCSP responder reports revoked → invalid', async ({ page }) => {
    await mockOcspRevoked(page)
    await uploadAndExpectInvalid(page, fix('oa_v2_dnsdid_ocsp.json'), 'has been revoked by the issuing authority')
  })

  test('OCSP responder reports not revoked → valid', async ({ page }) => {
    await mockOcspNotRevoked(page)
    await uploadAndExpectValid(page, fix('oa_v2_dnsdid_ocsp.json'), { template: 'CHAFTA' })
  })

  // ── Revocation store (DNS-DID) ─────────────────────────────────────────────
  test('revocation store revoked → invalid', async ({ page }) => {
    await uploadAndExpectInvalid(page, fix('oa_v2_dnsdid_revocationstore_revoked.json'), 'has been revoked by the issuing authority')
  })

  test('revocation store not revoked → valid', async ({ page }) => {
    await uploadAndExpectValid(page, fix('oa_v2_dnsdid_revocationstore_not_revoked.json'), { template: 'CHAFTA' })
  })

  test('revocation store contract not deployed → invalid', async ({ page }) => {
    await uploadAndExpectInvalid(page, fix('oa_v2_dnsdid_revocationstore_no_contract.json'), 'misconfigured their Document store or Token registry address')
  })

  // ── Document integrity errors ──────────────────────────────────────────────
  test('DNS-DID tampered → invalid', async ({ page }) => {
    await uploadAndExpectInvalid(page, fix('oa_v2_dnsdid_tampered.json'), 'inaccurate and have been tampered with')
  })

  test('DNS-TXT tampered → invalid', async ({ page }) => {
    await mockIssuerDns(page)
    await uploadAndExpectInvalid(page, fix('oa_v2_dnstxt_docstore_tampered.json'), 'inaccurate and have been tampered with')
  })
})

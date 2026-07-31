/**
 * End-to-end verification tests for Polygon POL mainnet (chainId 137).
 * Covers OA v2 and W3C VC document types.
 *
 * Prerequisites: the app must be running on http://localhost:5173
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { test } from '@playwright/test'
import {
  uploadDoc,
  assertAllValid,
  assertVerificationFailed,
  writeTamperedOa,
  writeNotMintedOa,
  writeTamperedW3c,
  writeNotMintedW3c,
} from '../helpers/verify-helpers'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/pol-amoy/pol')

const OA_POL_MINTED  = path.join(FIXTURE_DIR, 'oa-pol-minted.json')
const W3C_POL_MINTED = path.join(FIXTURE_DIR, 'w3c-pol-minted.json')

const OA_POL_TAMPERED    = writeTamperedOa( OA_POL_MINTED,  'oa-pol-tampered.json')
const OA_POL_NOT_MINTED  = writeNotMintedOa(OA_POL_MINTED,  'oa-pol-not-minted.json')
const W3C_POL_TAMPERED   = writeTamperedW3c( W3C_POL_MINTED, 'w3c-pol-tampered.json')
const W3C_POL_NOT_MINTED = writeNotMintedW3c(W3C_POL_MINTED, 'w3c-pol-not-minted.json')

// ══════════════════════════════════════════════════════════════════════════
// Polygon POL mainnet  (chainId 137)  –  OA v2
// ══════════════════════════════════════════════════════════════════════════

test.describe('POL mainnet – OA v2 document', () => {
  test.describe.configure({ retries: 2 })
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const dismissBtn = page.locator('[data-testid="dismiss-modal"]')
    if (await dismissBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await dismissBtn.click()
    }
  })

  // fixme: requires POL mainnet infrastructure — deploy token registry
  // 0x0961d9C2dA9a7105fDFC9DC4ec45951C024F88B0 on chainId 137, mint the
  // merkleRoot in oa-pol-minted.json, and add DNS-TXT records for that
  // registry to example.tradetrust.io before enabling this test.
  test.fixme('[POL OA] valid minted document – all three checks VALID', async ({ page }) => {
    await uploadDoc(page, OA_POL_MINTED)
    await assertAllValid(page)
  })

  test('[POL OA] tampered document (targetHash mutated) – DOCUMENT_INTEGRITY INVALID', async ({ page }) => {
    await uploadDoc(page, OA_POL_TAMPERED)
    await assertVerificationFailed(page)
  })

  test('[POL OA] not-minted document (merkleRoot replaced) – DOCUMENT_STATUS INVALID', async ({ page }) => {
    await uploadDoc(page, OA_POL_NOT_MINTED)
    await assertVerificationFailed(page)
  })
})

// ──────────────────────────────────────────────────────────────────────────
// Polygon POL mainnet  –  W3C VC
// ──────────────────────────────────────────────────────────────────────────

test.describe('POL mainnet – W3C VC document', () => {
  test.describe.configure({ retries: 2 })
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const dismissBtn = page.locator('[data-testid="dismiss-modal"]')
    if (await dismissBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await dismissBtn.click()
    }
  })

  // fixme: requires POL mainnet infrastructure — token registry
  // 0x0961d9C2dA9a7105fDFC9DC4ec45951C024F88B0 on chainId 137 must have
  // the tokenId from w3c-pol-minted.json minted before enabling this test.
  test.fixme('[POL W3C] valid minted document – all three checks VALID', async ({ page }) => {
    await uploadDoc(page, W3C_POL_MINTED)
    await assertAllValid(page)
  })

  test('[POL W3C] tampered document (proofValue mutated) – DOCUMENT_INTEGRITY INVALID', async ({ page }) => {
    await uploadDoc(page, W3C_POL_TAMPERED)
    await assertVerificationFailed(page)
  })

  test('[POL W3C] not-minted document (tokenId replaced) – DOCUMENT_STATUS INVALID', async ({ page }) => {
    await uploadDoc(page, W3C_POL_NOT_MINTED)
    await assertVerificationFailed(page)
  })
})

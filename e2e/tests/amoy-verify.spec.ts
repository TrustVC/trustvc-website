/**
 * End-to-end verification tests for Polygon Amoy testnet (chainId 80002).
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

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/pol-amoy/amoy')

const OA_AMOY_MINTED  = path.join(FIXTURE_DIR, 'oa-amoy-minted.json')
const W3C_AMOY_MINTED = path.join(FIXTURE_DIR, 'w3c-amoy-minted.json')

const OA_AMOY_TAMPERED    = writeTamperedOa( OA_AMOY_MINTED,  'oa-amoy-tampered.json')
const OA_AMOY_NOT_MINTED  = writeNotMintedOa(OA_AMOY_MINTED,  'oa-amoy-not-minted.json')
const W3C_AMOY_TAMPERED   = writeTamperedW3c( W3C_AMOY_MINTED, 'w3c-amoy-tampered.json')
const W3C_AMOY_NOT_MINTED = writeNotMintedW3c(W3C_AMOY_MINTED, 'w3c-amoy-not-minted.json')

// ══════════════════════════════════════════════════════════════════════════
// Polygon Amoy testnet  (chainId 80002)  –  OA v2
// ══════════════════════════════════════════════════════════════════════════

test.describe('Amoy testnet – OA v2 document', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const dismissBtn = page.locator('[data-testid="dismiss-modal"]')
    if (await dismissBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await dismissBtn.click()
    }
  })

  test('[Amoy OA] valid minted document – all three checks VALID', async ({ page }) => {
    await uploadDoc(page, OA_AMOY_MINTED)
    await assertAllValid(page)
  })

  test('[Amoy OA] tampered document (targetHash mutated) – DOCUMENT_INTEGRITY INVALID', async ({ page }) => {
    await uploadDoc(page, OA_AMOY_TAMPERED)
    await assertVerificationFailed(page)
  })

  test('[Amoy OA] not-minted document (merkleRoot replaced) – DOCUMENT_STATUS INVALID', async ({ page }) => {
    await uploadDoc(page, OA_AMOY_NOT_MINTED)
    await assertVerificationFailed(page)
  })
})

// ──────────────────────────────────────────────────────────────────────────
// Polygon Amoy testnet  –  W3C VC
// ──────────────────────────────────────────────────────────────────────────

test.describe('Amoy testnet – W3C VC document', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const dismissBtn = page.locator('[data-testid="dismiss-modal"]')
    if (await dismissBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await dismissBtn.click()
    }
  })

  test('[Amoy W3C] valid minted document – all three checks VALID', async ({ page }) => {
    await uploadDoc(page, W3C_AMOY_MINTED)
    await assertAllValid(page)
  })

  test('[Amoy W3C] tampered document (proofValue mutated) – DOCUMENT_INTEGRITY INVALID', async ({ page }) => {
    await uploadDoc(page, W3C_AMOY_TAMPERED)
    await assertVerificationFailed(page)
  })

  test('[Amoy W3C] not-minted document (tokenId replaced) – DOCUMENT_STATUS INVALID', async ({ page }) => {
    await uploadDoc(page, W3C_AMOY_NOT_MINTED)
    await assertVerificationFailed(page)
  })
})

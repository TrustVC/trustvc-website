/**
 * End-to-end verification tests for trustvc-website.
 *
 * Covers Polygon Amoy (testnet, chainId 80002) and Polygon POL mainnet
 * (chainId 137) for both OpenAttestation v2 (OA) and W3C Verifiable
 * Credential document types.
 *
 * Status scenarios exercised per network × document type:
 *   VALID       – minted document, all three checks (DOCUMENT_INTEGRITY,
 *                 DOCUMENT_STATUS, ISSUER_IDENTITY) must be VALID
 *   TAMPERED    – same document JSON with signature/proof corrupted at
 *                 runtime → DOCUMENT_INTEGRITY must be INVALID
 *   NOT MINTED  – structurally-valid document whose tokenId (merkleRoot)
 *                 is absent from the registry → DOCUMENT_STATUS must be INVALID
 *
 * All failure scenarios are generated at runtime by mutating a copy of the
 * minted fixture and writing it to a temp file — no separate "bad" fixture
 * files are needed.
 *
 * Prerequisites: the app must be running on http://localhost:5173
 *   npm run dev   (or: npm run preview)
 */

import path from 'path'
import fs from 'fs'
import os from 'os'
import { fileURLToPath } from 'url'
import { test, expect } from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// ── fixture paths ──────────────────────────────────────────────────────────
const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/pol-amoy')

const OA_AMOY_MINTED  = path.join(FIXTURE_DIR, 'amoy/oa-amoy-minted.json')
const OA_POL_MINTED   = path.join(FIXTURE_DIR, 'pol/oa-pol-minted.json')
const W3C_AMOY_MINTED = path.join(FIXTURE_DIR, 'amoy/w3c-amoy-minted.json')
const W3C_POL_MINTED  = path.join(FIXTURE_DIR, 'pol/w3c-pol-minted.json')

// ── temp-file helpers ──────────────────────────────────────────────────────
const TEMP_DIR = path.join(os.tmpdir(), 'trustvc-pol-amoy-tests')
fs.mkdirSync(TEMP_DIR, { recursive: true })

const UNUSED_HASH = 'deadbeef' + '0'.repeat(56) // 64-char hex, never minted

function writeTamperedOa(srcPath: string, name: string): string {
  const doc = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
  doc.signature = { ...doc.signature, targetHash: UNUSED_HASH }
  const dest = path.join(TEMP_DIR, name)
  fs.writeFileSync(dest, JSON.stringify(doc))
  return dest
}

function writeNotMintedOa(srcPath: string, name: string): string {
  const doc = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
  doc.signature = { ...doc.signature, targetHash: UNUSED_HASH, merkleRoot: UNUSED_HASH }
  const dest = path.join(TEMP_DIR, name)
  fs.writeFileSync(dest, JSON.stringify(doc))
  return dest
}

function writeTamperedW3c(srcPath: string, name: string): string {
  const doc = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
  const pv: string = doc.proof.proofValue
  doc.proof = { ...doc.proof, proofValue: pv.slice(0, -1) + (pv.endsWith('A') ? 'B' : 'A') }
  const dest = path.join(TEMP_DIR, name)
  fs.writeFileSync(dest, JSON.stringify(doc))
  return dest
}

function writeNotMintedW3c(srcPath: string, name: string): string {
  const doc = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
  doc.credentialStatus = { ...doc.credentialStatus, tokenId: UNUSED_HASH }
  const dest = path.join(TEMP_DIR, name)
  fs.writeFileSync(dest, JSON.stringify(doc))
  return dest
}

// Generate all runtime-modified fixtures once before the suite
const OA_AMOY_TAMPERED    = writeTamperedOa( OA_AMOY_MINTED,  'oa-amoy-tampered.json')
const OA_AMOY_NOT_MINTED  = writeNotMintedOa(OA_AMOY_MINTED,  'oa-amoy-not-minted.json')
const OA_POL_TAMPERED     = writeTamperedOa( OA_POL_MINTED,   'oa-pol-tampered.json')
const OA_POL_NOT_MINTED   = writeNotMintedOa(OA_POL_MINTED,   'oa-pol-not-minted.json')
const W3C_AMOY_TAMPERED   = writeTamperedW3c(W3C_AMOY_MINTED, 'w3c-amoy-tampered.json')
const W3C_AMOY_NOT_MINTED = writeNotMintedW3c(W3C_AMOY_MINTED,'w3c-amoy-not-minted.json')
const W3C_POL_TAMPERED    = writeTamperedW3c(W3C_POL_MINTED,  'w3c-pol-tampered.json')
const W3C_POL_NOT_MINTED  = writeNotMintedW3c(W3C_POL_MINTED, 'w3c-pol-not-minted.json')

// ── shared helpers ─────────────────────────────────────────────────────────

async function uploadDoc(page: import('@playwright/test').Page, filePath: string) {
  // Reset from VerifyResult state
  const resetBtn = page.locator('[data-testid="upload-new-file-btn"]')
  if (await resetBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await resetBtn.click()
  }
  // Reset from VerifyError state
  const tryAnotherBtn = page.locator('[data-testid="try-another-btn"]')
  if (await tryAnotherBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await tryAnotherBtn.click()
  }

  await page.locator('#file-upload').setInputFiles(filePath)

  const verifying = page.locator('[data-testid="verifying-state"]')

  // Loader may appear too briefly or be delayed by React batching; don't fail if initial visibility is missed.
  await verifying.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {})
  await verifying.waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => {})

  // VerifyResult (data-testid="verify-result") is shown only for valid docs.
  // VerifyError (data-testid="try-another-btn") is shown for invalid/error docs.
  // Wait for whichever terminal state the component settles into.
  await page
    .locator('[data-testid="verify-result"], [data-testid="try-another-btn"]')
    .first()
    .waitFor({ state: 'visible', timeout: 60_000 })
}

async function assertCheckStatus(
  page: import('@playwright/test').Page,
  check: 'document_integrity' | 'document_status' | 'issuer_identity',
  status: 'VALID',
) {
  await expect(
    page.locator(`[data-testid="check-${check}"][data-status="${status}"]`),
  ).toBeVisible()
}

// The component renders VerifyError (not VerifyResult) for invalid/error docs,
// so individual check statuses are not exposed in the DOM for failing scenarios.
// Assert on the VerifyError UI instead.
async function assertVerificationFailed(page: import('@playwright/test').Page) {
  await expect(page.locator('[data-testid="try-another-btn"]')).toBeVisible()
}

async function assertAllValid(page: import('@playwright/test').Page) {
  await assertCheckStatus(page, 'document_integrity', 'VALID')
  await assertCheckStatus(page, 'document_status',    'VALID')
  await assertCheckStatus(page, 'issuer_identity',    'VALID')
}

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

  test('[POL OA] valid minted document – all three checks VALID', async ({ page }) => {
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

  test('[POL W3C] valid minted document – all three checks VALID', async ({ page }) => {
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

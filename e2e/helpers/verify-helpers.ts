import path from 'path'
import fs from 'fs'
import os from 'os'
import { expect, type Page } from '@playwright/test'

export const TEMP_DIR = path.join(os.tmpdir(), 'trustvc-pol-amoy-tests')
fs.mkdirSync(TEMP_DIR, { recursive: true })

const UNUSED_HASH = 'deadbeef' + '0'.repeat(56)

export function writeTamperedOa(srcPath: string, name: string): string {
  const doc = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
  doc.signature = { ...doc.signature, targetHash: UNUSED_HASH }
  const dest = path.join(TEMP_DIR, name)
  fs.writeFileSync(dest, JSON.stringify(doc))
  return dest
}

export function writeNotMintedOa(srcPath: string, name: string): string {
  const doc = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
  doc.signature = { ...doc.signature, targetHash: UNUSED_HASH, merkleRoot: UNUSED_HASH }
  const dest = path.join(TEMP_DIR, name)
  fs.writeFileSync(dest, JSON.stringify(doc))
  return dest
}

export function writeTamperedW3c(srcPath: string, name: string): string {
  const doc = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
  const pv: string = doc.proof.proofValue
  doc.proof = { ...doc.proof, proofValue: pv.slice(0, -1) + (pv.endsWith('A') ? 'B' : 'A') }
  const dest = path.join(TEMP_DIR, name)
  fs.writeFileSync(dest, JSON.stringify(doc))
  return dest
}

export function writeNotMintedW3c(srcPath: string, name: string): string {
  const doc = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
  doc.credentialStatus = { ...doc.credentialStatus, tokenId: UNUSED_HASH }
  const dest = path.join(TEMP_DIR, name)
  fs.writeFileSync(dest, JSON.stringify(doc))
  return dest
}

export async function uploadDoc(page: Page, filePath: string) {
  const resetBtn = page.locator('[data-testid="upload-new-file-btn"]')
  if (await resetBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await resetBtn.click()
  }
  const tryAnotherBtn = page.locator('[data-testid="try-another-btn"]')
  if (await tryAnotherBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await tryAnotherBtn.click()
  }

  await page.locator('#file-upload').setInputFiles(filePath)

  const verifying = page.locator('[data-testid="verifying-state"]')
  // Loader may appear too briefly or be delayed by React batching; don't fail if missed.
  await verifying.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {})
  await verifying.waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => {})

  // VerifyResult shown for valid docs; VerifyError (try-another-btn) for invalid/error.
  await page
    .locator('[data-testid="verify-result"], [data-testid="try-another-btn"]')
    .first()
    .waitFor({ state: 'visible', timeout: 60_000 })
}

export async function assertCheckStatus(
  page: Page,
  check: 'document_integrity' | 'document_status' | 'issuer_identity',
  status: 'VALID',
) {
  await expect(
    page.locator(`[data-testid="check-${check}"][data-status="${status}"]`),
  ).toBeVisible()
}

// The component renders VerifyError (not VerifyResult) for invalid/error docs,
// so individual check statuses are not in the DOM for failing scenarios.
export async function assertVerificationFailed(page: Page) {
  await expect(page.locator('[data-testid="try-another-btn"]')).toBeVisible()
}

export async function assertAllValid(page: Page) {
  await assertCheckStatus(page, 'document_integrity', 'VALID')
  await assertCheckStatus(page, 'document_status', 'VALID')
  await assertCheckStatus(page, 'issuer_identity', 'VALID')
}

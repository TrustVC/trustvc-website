/**
 * Deploys TrustVC contracts to local Hardhat and writes a test transferable
 * document to e2e/fixtures/transferable-document.json.
 *
 * Prerequisites:
 *   - Local Hardhat node running:  npx hardhat node
 *
 * Usage:
 *   npx ts-node --esm e2e/helpers/deploy.ts
 *   — or —
 *   node --loader ts-node/esm e2e/helpers/deploy.ts
 */

import { ethers } from 'ethers'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Hardhat default account #0
const HOLDER_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const HOLDER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

// Hardhat default account #1 (transfer target)
const NEW_HOLDER_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'

const RPC_URL = 'http://127.0.0.1:8545'
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures')

async function deploy() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
  const signer = new ethers.Wallet(HOLDER_PRIVATE_KEY, provider)

  console.log('Connected to Hardhat at', RPC_URL)
  console.log('Deploying from', await signer.getAddress())

  // ── Deploy TradeTrustToken (token registry) ──────────────────────────────
  // Minimal ABI + bytecode — in practice pull from @tradetrust-tt/token-registry
  // or use the SDK's deploy utilities. Shown here as pseudocode:
  //
  //   import { TradeTrustToken__factory } from '@tradetrust-tt/token-registry'
  //   const tokenRegistry = await TradeTrustToken__factory.connect(signer).deploy(
  //     'Test Token', 'TST', HOLDER_ADDRESS
  //   )
  //   await tokenRegistry.deployed()
  //
  // For now we export the addresses so you can fill them in manually after
  // deploying via `npx hardhat run scripts/deploy.js --network localhost`.

  const tokenRegistryAddress = process.env.TOKEN_REGISTRY_ADDRESS
  const tokenId =
    process.env.TOKEN_ID ||
    '0x0000000000000000000000000000000000000000000000000000000000000001'

  if (!tokenRegistryAddress) {
    console.error(
      '\nMissing TOKEN_REGISTRY_ADDRESS environment variable.\n' +
        'Deploy the token registry first and re-run:\n' +
        '  TOKEN_REGISTRY_ADDRESS=0x... npx ts-node --esm e2e/helpers/deploy.ts\n'
    )
    process.exit(1)
  }

  // ── Build minimal transferable document ──────────────────────────────────
  const document = {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://w3id.org/security/data-integrity/v2',
      'https://trustvc.io/context/render-method-context-v2.json',
      'https://trustvc.io/context/bill-of-lading-carrier.json',
      'https://trustvc.io/context/transferable-records-context.json',
    ],
    renderMethod: [
      {
        type: 'EMBEDDED_RENDERER',
        templateName: 'BILL_OF_LADING_CARRIER',
        id: 'https://generic-templates.tradetrust.io',
      },
    ],
    credentialSubject: {
      type: ['BillOfLadingCarrier'],
      blNumber: 'E2E-TEST-001',
      carrierName: 'E2E Test Carrier',
    },
    // Transferable record fields
    network: {
      chain: 'HARDHAT',
      chainId: '31337',
    },
    tokenRegistry: tokenRegistryAddress,
    tokenId,
    // The current holder is Hardhat account #0
    // (set by the TitleEscrow contract, not the document itself)
  }

  fs.mkdirSync(FIXTURES_DIR, { recursive: true })
  const outPath = path.join(FIXTURES_DIR, 'transferable-document.json')
  fs.writeFileSync(outPath, JSON.stringify(document, null, 2))

  console.log('\nWrote test document to', outPath)
  console.log('Token registry:', tokenRegistryAddress)
  console.log('Token ID:      ', tokenId)
  console.log('Holder:        ', HOLDER_ADDRESS)
  console.log('New holder:    ', NEW_HOLDER_ADDRESS)
}

deploy().catch(err => {
  console.error(err)
  process.exit(1)
})

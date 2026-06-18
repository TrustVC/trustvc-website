/**
 * Deploys an OpenAttestation DocumentStore to the local Hardhat node and sets up
 * the on-chain state for the OA *verification* e2e fixtures (document-store cases).
 *
 * This is intentionally SEPARATE from setup-contracts.cjs (which handles the
 * transferable-record token registry) and uses a DEDICATED deployer account
 * (Hardhat account #3) that no other setup touches — so the store address is
 * deterministic (account #3, nonce 0) and this script never interferes with the
 * transferable-record setup or fixtures.
 *
 * Run against a running hardhat node, after setup-contracts.cjs:
 *   node e2e/setup-document-store.cjs
 *
 * The merkleRoots below MUST match the committed fixtures in
 * e2e/fixtures/local/oa/oa_v2_docstore_*.json (regenerate both together).
 */
const { ethers, Wallet } = require('ethers')
const { DocumentStore__factory } = require('@trustvc/document-store')

// Hardhat account #3 — pristine (setup-contracts.cjs uses #0/#1). Local/CI only.
const DEPLOYER_KEY =
  '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6'
const EXPECTED_STORE = '0x057ef64E23666F000b34aE31332854aCBd1c8544' // acct #3, nonce 0

// merkleRoots of the committed fixtures (e2e/fixtures/local/oa/oa_v2_*.json)
const ISSUED = '0xd0359643795f10b3f69ce0a1969c67eba53ce3cdcc050fc549b768c04bb92b4a'
const REVOKED = '0xa24c4e7e3f441de3b0466c88c862fa66e513180d723b9799fe07f1594a9ca07d'
// Issued so its document status is VALID — the DNS-TXT identity is the only failing
// check (oa_v2_dnstxt_identity_invalid.json points at a domain with no DNS record).
const IDENTITY_INVALID = '0x6ad1a501ebbb827455195b7012b0e1fa0dda2052111831d95fa1e8fbf370fa0b'
// not-issued root is intentionally NEVER issued:
// 0x1a442765be78cc6c706a4a637cea7faa63a2841cc92b1715418d00fd6b76b895
// DNS-DID doc revoked via this store used as a REVOCATION_STORE (revoke only — DID-signed,
// not issued here). The not-revoked counterpart (0xebf9daa3…) is deliberately left alone.
const REVSTORE_REVOKED = '0x1edea2001ccb702ed3484b3cbd07366c79c870c803bbf379b96486bca9e97ff6'
// Issued (not revoked) so isRevoked() resolves cleanly → the DNS-DID doc verifies VALID.
const REVSTORE_NOT_REVOKED = '0xebf9daa3ba4bb4c497a30e765e63fa37d2c234eedd9a30c23b1d84763f39e046'

;(async () => {
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/', 1337)
  const signer = new Wallet(DEPLOYER_KEY, provider)
  const deployer = await signer.getAddress()
  const nonce = await signer.getTransactionCount()
  console.log('Document-store deployer (acct #3):', deployer, '| nonce:', nonce)

  console.log('Deploying DocumentStore...')
  const factory = new ethers.ContractFactory(
    DocumentStore__factory.abi,
    DocumentStore__factory.bytecode,
    signer
  )
  const store = await factory.deploy('E2E Verification Document Store', deployer)
  await store.deployed()
  console.log('DocumentStore deployed at:', store.address)

  if (store.address.toLowerCase() !== EXPECTED_STORE.toLowerCase()) {
    throw new Error(
      `DocumentStore address ${store.address} != expected ${EXPECTED_STORE}. ` +
        `Account #3 must be pristine (nonce 0) on a fresh node. ` +
        `If this changed, regenerate the fixtures with the new address.`
    )
  }

  console.log('Issuing + revoking fixture merkleRoots...')
  await (await store.issue(ISSUED)).wait()
  await (await store.issue(IDENTITY_INVALID)).wait()
  await (await store.issue(REVOKED)).wait()
  await (await store['revoke(bytes32)'](REVOKED)).wait()
  // REVOCATION_STORE use (DNS-DID doc): this store requires issue-before-revoke; the
  // DID-signed verifier only reads isRevoked(), so issuing it first is harmless.
  await (await store.issue(REVSTORE_REVOKED)).wait()
  await (await store['revoke(bytes32)'](REVSTORE_REVOKED)).wait()
  // not-revoked counterpart: issue only (so isRevoked() returns false without reverting)
  await (await store.issue(REVSTORE_NOT_REVOKED)).wait()

  // sanity
  console.log('isIssued(issued)   :', await store['isIssued(bytes32)'](ISSUED))
  console.log('isIssued(identity) :', await store['isIssued(bytes32)'](IDENTITY_INVALID))
  console.log('isRevoked(revoked) :', await store['isRevoked(bytes32)'](REVOKED))
  console.log('isRevoked(revstore):', await store['isRevoked(bytes32)'](REVSTORE_REVOKED))
  console.log('\n=== Document Store Setup Complete ===')
  console.log('DocumentStore:', store.address)
})().catch(err => {
  console.error(err)
  process.exit(1)
})

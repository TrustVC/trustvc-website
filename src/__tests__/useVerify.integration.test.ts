// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  verifyDocument,
  getChainId,
  isTransferableRecord,
  isDocumentRevokable,
  isValid,
  VerificationFragment,
} from '@trustvc/trustvc'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// OA v2
import oaDnsDidV2 from './__fixtures__/oa/2.0/signed_wrapped_oa_dns_did_v2.json'
import oaDnsTxtDocstoreV2 from './__fixtures__/oa/2.0/signed_wrapped_oa_dns_txt_docstore_v2.json'
import oaDnsTxtTokenRegistryV2 from './__fixtures__/oa/2.0/signed_wrapped_oa_dns_txt_token_registry_v2.json'
import oaNoNetworkEthereumV2 from './__fixtures__/oa/2.0/oa_dns_txt_docstore_no_network_field_ethereum_v2.json'

// OA v3
import oaDnsDidV3 from './__fixtures__/oa/3.0/signed_wrapped_oa_dns_did_v3.json'
import oaDnsTxtDocstoreV3 from './__fixtures__/oa/3.0/signed_wrapped_oa_dns_txt_docstore_v3.json'
import oaDnsTxtTokenRegistryV3 from './__fixtures__/oa/3.0/signed_wrapped_oa_dns_txt_token_registry_v3.json'
import oaNoNetworkStabilityV3 from './__fixtures__/oa/3.0/oa_dns_txt_token_registry_no_network_field_stability_v3.json'

// W3C
import w3cBbs2020VerifiableDoc from './__fixtures__/w3c/bbs2020_w3c_verifiable_document_v1_1.json'
import w3cBbs2020TransferableRecord from './__fixtures__/w3c/bbs2020_w3c_transferable_record_v1_1.json'
import w3cBbs2023VerifiableDoc from './__fixtures__/w3c/bbs2023_w3c_verifiable_document_v2_0.json'
import w3cBbs2023TransferableDoc from './__fixtures__/w3c/bbs2023_w3c_transferable_document_v2_0.json'
import w3cEcdsaVerifiableDoc from './__fixtures__/w3c/ecdsa_w3c_verifiable_document_v2_0.json'
import w3cEcdsaTransferableDoc from './__fixtures__/w3c/ecdsa_w3c_transferable_document_v2_0.json'
import w3cExpiredDoc from './__fixtures__/w3c/expired_bbs2020_w3c_verifiable_document_v1_1.json'
import w3cRevokedDoc from './__fixtures__/w3c/revoked_ecdsa_w3c_verifiable_document_v2_0.json'

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface VerifyOptions {
  rpcProviderUrl?: string
  network?: string
}

const verify = async (doc: unknown, options: VerifyOptions = {}) => {
  const results = (await verifyDocument(
    doc as any,
    options
  )) as VerificationFragment[]

  return {
    results,
    isValid: isValid(results),
  }
}

const needsNetworkSelect = (doc: unknown): boolean => {
  const chainId = getChainId(doc as any)
  return (
    !chainId &&
    (isTransferableRecord(doc as any) || isDocumentRevokable(doc as any))
  )
}

/** Public Stability mainnet RPC (chain 101010). */
const STABILITY_MAINNET_RPC_FALLBACK =
  'https://rpc.stabilityprotocol.com/zgt/tradeTrust'

const getRpcUrl = (chainId: string): string | undefined => {
  const envUrl = process.env[`VITE_RPC_URL_${chainId}`]

  // Stability mainnet fixtures use chain 101010; local .env often points at testnet RPC by mistake.
  if (chainId === '101010') {
    if (!envUrl || /testnet|free\.testnet/i.test(envUrl)) {
      return STABILITY_MAINNET_RPC_FALLBACK
    }
    return envUrl
  }

  return envUrl
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('verifyDocument — integration with real fixtures', () => {
  // ── Network-select detection ───────────────────────────────────────────────

  describe('documents with no network field → need network selection', () => {
    it('OA v2 docstore (no network field) → detects need for network selection', () => {
      expect(needsNetworkSelect(oaNoNetworkEthereumV2)).toBe(true)
    })

    it('OA v3 token registry (no network field) → detects need for network selection', () => {
      expect(needsNetworkSelect(oaNoNetworkStabilityV3)).toBe(true)
    })
  })

  // ── DID-based (no RPC needed) ──────────────────────────────────────────────

  describe('DNS-DID documents → valid', () => {
    it('OA v2 DNS-DID', async () => {
      const { isValid } = await verify(oaDnsDidV2)
      expect(isValid).toBe(true)
    })

    it('OA v3 DNS-DID', async () => {
      const { isValid } = await verify(oaDnsDidV3)
      expect(isValid).toBe(true)
    })
  })

  // ── W3C verifiable documents ───────────────────────────────────────────────

  describe('W3C verifiable documents → valid', () => {
    it('BBS2020 verifiable document', async () => {
      const { isValid } = await verify(w3cBbs2020VerifiableDoc)
      expect(isValid).toBe(true)
    })

    it('BBS2020 expired verifiable document', async () => {
      const { isValid } = await verify(w3cExpiredDoc)
      expect(isValid).toBe(true)
    })

    it('BBS2023 verifiable document', async () => {
      const { isValid } = await verify(w3cBbs2023VerifiableDoc)
      expect(isValid).toBe(true)
    })

    it('ECDSA verifiable document', async () => {
      const { isValid } = await verify(w3cEcdsaVerifiableDoc)
      expect(isValid).toBe(true)
    })
  })

  describe.skipIf(!getRpcUrl('101010'))(
    'W3C transferable documents → valid',
    () => {
      const rpcUrl = getRpcUrl('101010') // Stability

      it('BBS2020 transferable record', async () => {
        const { isValid } = await verify(w3cBbs2020TransferableRecord, {
          rpcProviderUrl: rpcUrl,
        })
        expect(isValid).toBe(true)
      })

      it('BBS2023 transferable document', async () => {
        const { isValid } = await verify(w3cBbs2023TransferableDoc, {
          rpcProviderUrl: rpcUrl,
        })
        expect(isValid).toBe(true)
      })

      it('ECDSA transferable document', async () => {
        const { isValid } = await verify(w3cEcdsaTransferableDoc, {
          rpcProviderUrl: rpcUrl,
        })
        expect(isValid).toBe(true)
      })
    }
  )

  // ── W3C invalid documents ──────────────────────────────────────────────────

  describe.skipIf(!getRpcUrl('101010'))(
    'W3C documents expected to be invalid',
    () => {
      it('revoked ECDSA W3C document → invalid', async () => {
        const rpcUrl = getRpcUrl('101010') // Stability

        const { isValid } = await verify(w3cRevokedDoc, {
          rpcProviderUrl: rpcUrl,
        })
        expect(isValid).toBe(false)
      })
    }
  )

  // ── OA blockchain documents ────────────────────────────

  describe.skipIf(!getRpcUrl('101010'))(
    'OA blockchain documents → valid',
    () => {
      const stabilityRpcUrl = getRpcUrl('101010') // Stability

      it('OA v2 DNS-TXT docstore', async () => {
        const { isValid } = await verify(oaDnsTxtDocstoreV2, {
          rpcProviderUrl: stabilityRpcUrl,
        })
        expect(isValid).toBe(true)
      })

      it('OA v2 DNS-TXT token registry', async () => {
        const { isValid } = await verify(oaDnsTxtTokenRegistryV2, {
          rpcProviderUrl: stabilityRpcUrl,
        })
        expect(isValid).toBe(true)
      })

      it('OA v3 DNS-TXT docstore', async () => {
        const { isValid } = await verify(oaDnsTxtDocstoreV3, {
          rpcProviderUrl: stabilityRpcUrl,
        })
        expect(isValid).toBe(true)
      })

      it('OA v3 DNS-TXT token registry', async () => {
        const { isValid } = await verify(oaDnsTxtTokenRegistryV3, {
          rpcProviderUrl: stabilityRpcUrl,
        })
        expect(isValid).toBe(true)
      })
    }
  )

  // ── Documents without network field (need explicit RPC) ──────────────────

  describe('Documents without embedded network → valid with explicit RPC', () => {
    it.skipIf(!getRpcUrl('1'))(
      'OA v2 docstore (no network field) → valid with Ethereum RPC',
      async () => {
        const ethereumRpcUrl = getRpcUrl('1')
        const { isValid } = await verify(oaNoNetworkEthereumV2, {
          rpcProviderUrl: ethereumRpcUrl,
        })
        expect(isValid).toBe(true)
      }
    )

    it.skipIf(!getRpcUrl('101010'))(
      'OA v3 token registry (no network field) → valid with Stability RPC',
      async () => {
        const stabilityRpcUrl = getRpcUrl('101010')
        const { isValid } = await verify(oaNoNetworkStabilityV3, {
          rpcProviderUrl: stabilityRpcUrl,
        })
        expect(isValid).toBe(true)
      }
    )
  })
})

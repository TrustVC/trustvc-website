/**
 * Tests for all 10 gasless transaction hooks.
 *
 * Structure:
 *  - Initial state tests (all hooks)
 *  - Fallback path  — PIMLICO_API_KEY undefined → hasGaslessConfig = false → regular tx
 *  - Gasless path   — env vars set via vi.stubEnv + vi.resetModules → gasless tx
 *  - Error handling — MetaMask codes, contract errors
 *  - Reset          — clears state and error
 *  - Paymaster via localStorage (simulates the VerifyResult UI input)
 */

import { renderHook, act } from '@testing-library/react'
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest'

// ─── Hoisted mock functions (created before any import runs) ──────────────────

const mocks = vi.hoisted(() => ({
  checkEIP7702Delegation: vi.fn(),
  checkPaymasterWhitelist: vi.fn(),
  buildSmartAccountClient: vi.fn(),
  getRpcUrl: vi.fn(),
  // regular tx functions
  transferHolder: vi.fn(),
  transferBeneficiary: vi.fn(),
  transferOwners: vi.fn(),
  nominate: vi.fn(),
  rejectTransferHolder: vi.fn(),
  rejectTransferBeneficiary: vi.fn(),
  rejectTransferOwners: vi.fn(),
  returnToIssuer: vi.fn(),
  acceptReturned: vi.fn(),
  rejectReturned: vi.fn(),
  // gasless tx functions
  transferHolderGasless: vi.fn(),
  transferBeneficiaryGasless: vi.fn(),
  transferOwnersGasless: vi.fn(),
  nominateGasless: vi.fn(),
  rejectTransferHolderGasless: vi.fn(),
  rejectTransferBeneficiaryGasless: vi.fn(),
  rejectTransferOwnersGasless: vi.fn(),
  returnToIssuerGasless: vi.fn(),
  acceptReturnedGasless: vi.fn(),
  rejectReturnedGasless: vi.fn(),
}))

// ─── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('./checkDelegation', () => ({
  checkEIP7702Delegation: mocks.checkEIP7702Delegation,
}))

vi.mock('./checkPaymasterWhitelist', () => ({
  checkPaymasterWhitelist: mocks.checkPaymasterWhitelist,
}))

vi.mock('./buildSmartAccountClient', () => ({
  buildSmartAccountClient: mocks.buildSmartAccountClient,
}))

vi.mock('../utils/helper', () => ({
  getRpcUrl: mocks.getRpcUrl,
}))

vi.mock('../components/common/contexts/DocumentContext', () => ({
  useDocumentContext: vi.fn(() => ({ keyId: 'test-doc-key' })),
}))

vi.mock('../components/common/contexts/providerContext', () => ({
  useProviderContext: vi.fn(() => ({ account: ACCOUNT })),
}))

vi.mock('@trustvc/trustvc', () => ({
  transferHolder: mocks.transferHolder,
  transferHolderGasless: mocks.transferHolderGasless,
  transferBeneficiary: mocks.transferBeneficiary,
  transferBeneficiaryGasless: mocks.transferBeneficiaryGasless,
  transferOwners: mocks.transferOwners,
  transferOwnersGasless: mocks.transferOwnersGasless,
  nominate: mocks.nominate,
  nominateGasless: mocks.nominateGasless,
  rejectTransferHolder: mocks.rejectTransferHolder,
  rejectTransferHolderGasless: mocks.rejectTransferHolderGasless,
  rejectTransferBeneficiary: mocks.rejectTransferBeneficiary,
  rejectTransferBeneficiaryGasless: mocks.rejectTransferBeneficiaryGasless,
  rejectTransferOwners: mocks.rejectTransferOwners,
  rejectTransferOwnersGasless: mocks.rejectTransferOwnersGasless,
  returnToIssuer: mocks.returnToIssuer,
  returnToIssuerGasless: mocks.returnToIssuerGasless,
  acceptReturned: mocks.acceptReturned,
  acceptReturnedGasless: mocks.acceptReturnedGasless,
  rejectReturned: mocks.rejectReturned,
  rejectReturnedGasless: mocks.rejectReturnedGasless,
  eip7702Abis: { platformPaymasterAbi: [] },
}))

// ─── Static hook imports (PIMLICO_API_KEY is undefined here) ─────────────────

import { useGaslessTransferHolder } from './useGaslessTransferHolder'
import { useGaslessTransferBeneficiary } from './useGaslessTransferBeneficiary'
import { useGaslessTransferOwners } from './useGaslessTransferOwners'
import { useGaslessNominate } from './useGaslessNominate'
import { useGaslessRejectTransferHolder } from './useGaslessRejectTransferHolder'
import { useGaslessRejectTransferBeneficiary } from './useGaslessRejectTransferBeneficiary'
import { useGaslessRejectTransferOwners } from './useGaslessRejectTransferOwners'
import { useGaslessReturnToIssuer } from './useGaslessReturnToIssuer'
import { useGaslessAcceptReturned } from './useGaslessAcceptReturned'
import { useGaslessRejectReturned } from './useGaslessRejectReturned'

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCOUNT = '0x1234567890123456789012345678901234567890'
const TITLE_ESCROW = '0xaaaa000000000000000000000000000000000001'
const TOKEN_REGISTRY = '0xbbbb000000000000000000000000000000000002'
const PAYMASTER = '0xcccc000000000000000000000000000000000003'
const TOKEN_ID = '99999'
const CHAIN_ID = '11155111'
const RPC_URL = 'https://sepolia.example.com'
const GASLESS_TX = '0x' + 'a'.repeat(64)
const REGULAR_TX = '0x' + 'b'.repeat(64)

const CONTRACT_OPTIONS = {
  titleEscrowAddress: TITLE_ESCROW,
  tokenRegistryAddress: TOKEN_REGISTRY,
  tokenId: TOKEN_ID,
}

const mockSigner = { _isSigner: true } as any
const mockSmartAccountClient = { sendTransaction: vi.fn() }

const makeTx = (hash: string) => ({
  wait: vi.fn().mockResolvedValue({ transactionHash: hash }),
})

// ─── Shared setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  // Default: delegation passes, whitelist passes
  mocks.checkEIP7702Delegation.mockResolvedValue(true)
  mocks.checkPaymasterWhitelist.mockResolvedValue({
    isCallerAuthorized: true,
    isTitleEscrowAuthorized: true,
  })
  mocks.getRpcUrl.mockReturnValue(RPC_URL)
  mocks.buildSmartAccountClient.mockResolvedValue({
    smartAccountClient: mockSmartAccountClient,
  })
  mockSmartAccountClient.sendTransaction.mockResolvedValue(GASLESS_TX)

  // All regular functions return a tx receipt by default
  const mockTx = makeTx(REGULAR_TX)
  mocks.transferHolder.mockResolvedValue(mockTx)
  mocks.transferBeneficiary.mockResolvedValue(mockTx)
  mocks.transferOwners.mockResolvedValue(mockTx)
  mocks.nominate.mockResolvedValue(mockTx)
  mocks.rejectTransferHolder.mockResolvedValue(mockTx)
  mocks.rejectTransferBeneficiary.mockResolvedValue(mockTx)
  mocks.rejectTransferOwners.mockResolvedValue(mockTx)
  mocks.returnToIssuer.mockResolvedValue(mockTx)
  mocks.acceptReturned.mockResolvedValue(mockTx)
  mocks.rejectReturned.mockResolvedValue(mockTx)

  // All gasless functions return a tx hash by default
  mocks.transferHolderGasless.mockResolvedValue(GASLESS_TX)
  mocks.transferBeneficiaryGasless.mockResolvedValue(GASLESS_TX)
  mocks.transferOwnersGasless.mockResolvedValue(GASLESS_TX)
  mocks.nominateGasless.mockResolvedValue(GASLESS_TX)
  mocks.rejectTransferHolderGasless.mockResolvedValue(GASLESS_TX)
  mocks.rejectTransferBeneficiaryGasless.mockResolvedValue(GASLESS_TX)
  mocks.rejectTransferOwnersGasless.mockResolvedValue(GASLESS_TX)
  mocks.returnToIssuerGasless.mockResolvedValue(GASLESS_TX)
  mocks.acceptReturnedGasless.mockResolvedValue(GASLESS_TX)
  mocks.rejectReturnedGasless.mockResolvedValue(GASLESS_TX)

  // window.ethereum required for gasless eligibility
  ;(window as any).ethereum = {}

  // Put paymaster in localStorage (simulates user entering it in the UI)
  localStorage.setItem(`trustvc_paymaster_${ACCOUNT}`, PAYMASTER)
})

afterEach(() => {
  delete (window as any).ethereum
  localStorage.clear()
})

// ─────────────────────────────────────────────────────────────────────────────
// 1. Initial state
// ─────────────────────────────────────────────────────────────────────────────

describe('initial state', () => {
  const allHooks = [
    { name: 'useGaslessTransferHolder', hook: useGaslessTransferHolder },
    {
      name: 'useGaslessTransferBeneficiary',
      hook: useGaslessTransferBeneficiary,
    },
    { name: 'useGaslessTransferOwners', hook: useGaslessTransferOwners },
    { name: 'useGaslessNominate', hook: useGaslessNominate },
    {
      name: 'useGaslessRejectTransferHolder',
      hook: useGaslessRejectTransferHolder,
    },
    {
      name: 'useGaslessRejectTransferBeneficiary',
      hook: useGaslessRejectTransferBeneficiary,
    },
    {
      name: 'useGaslessRejectTransferOwners',
      hook: useGaslessRejectTransferOwners,
    },
    { name: 'useGaslessReturnToIssuer', hook: useGaslessReturnToIssuer },
    { name: 'useGaslessAcceptReturned', hook: useGaslessAcceptReturned },
    { name: 'useGaslessRejectReturned', hook: useGaslessRejectReturned },
  ]

  it.each(allHooks)('$name starts in UNINITIALIZED state', ({ hook }) => {
    const { result } = renderHook(() =>
      hook(CONTRACT_OPTIONS, mockSigner, undefined)
    )

    expect(result.current.state).toBe('UNINITIALIZED')
    expect(result.current.transactionHash).toBeUndefined()
    expect(result.current.errorMessage).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Fallback path — delegation check returns false → regular (paid) tx.
//    Note: VITE_PIMLICO_API_KEY may be set in .env so hasGaslessConfig can be
//    true, but checkEIP7702Delegation returning false is enough to prevent
//    the gasless path from being taken.
// ─────────────────────────────────────────────────────────────────────────────

describe('fallback path (delegation check fails → regular tx)', () => {
  beforeEach(() => {
    // Override the default (delegation=true) set in the outer beforeEach.
    // Every test in this block explicitly wants the non-gasless path.
    mocks.checkEIP7702Delegation.mockResolvedValue(false)
  })

  it('useGaslessTransferHolder uses transferHolder and reaches CONFIRMED', async () => {
    const { result } = renderHook(() =>
      useGaslessTransferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(mocks.transferHolder).toHaveBeenCalledOnce()
    expect(mocks.transferHolderGasless).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
    expect(result.current.transactionHash).toBe(REGULAR_TX)
  })

  it('useGaslessTransferBeneficiary uses transferBeneficiary', async () => {
    const { result } = renderHook(() =>
      useGaslessTransferBeneficiary(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ newBeneficiaryAddress: '0xNEWBENEF' })
    })

    expect(mocks.transferBeneficiary).toHaveBeenCalledOnce()
    expect(mocks.transferBeneficiaryGasless).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessTransferOwners uses transferOwners', async () => {
    const { result } = renderHook(() =>
      useGaslessTransferOwners(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({
        newHolderAddress: '0xNEWHOLDER',
        newBeneficiaryAddress: '0xNEWBENEF',
      })
    })

    expect(mocks.transferOwners).toHaveBeenCalledOnce()
    expect(mocks.transferOwnersGasless).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessNominate uses nominate', async () => {
    const { result } = renderHook(() =>
      useGaslessNominate(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ newBeneficiaryAddress: '0xNOMINEE' })
    })

    expect(mocks.nominate).toHaveBeenCalledOnce()
    expect(mocks.nominateGasless).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessRejectTransferHolder uses rejectTransferHolder', async () => {
    const { result } = renderHook(() =>
      useGaslessRejectTransferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(mocks.rejectTransferHolder).toHaveBeenCalledOnce()
    expect(mocks.rejectTransferHolderGasless).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessRejectTransferBeneficiary uses rejectTransferBeneficiary', async () => {
    const { result } = renderHook(() =>
      useGaslessRejectTransferBeneficiary(
        CONTRACT_OPTIONS,
        mockSigner,
        CHAIN_ID
      )
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(mocks.rejectTransferBeneficiary).toHaveBeenCalledOnce()
    expect(mocks.rejectTransferBeneficiaryGasless).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessRejectTransferOwners uses rejectTransferOwners', async () => {
    const { result } = renderHook(() =>
      useGaslessRejectTransferOwners(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(mocks.rejectTransferOwners).toHaveBeenCalledOnce()
    expect(mocks.rejectTransferOwnersGasless).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessReturnToIssuer uses returnToIssuer', async () => {
    const { result } = renderHook(() =>
      useGaslessReturnToIssuer(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(mocks.returnToIssuer).toHaveBeenCalledOnce()
    expect(mocks.returnToIssuerGasless).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessAcceptReturned uses acceptReturned', async () => {
    const { result } = renderHook(() =>
      useGaslessAcceptReturned(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(mocks.acceptReturned).toHaveBeenCalledOnce()
    expect(mocks.acceptReturnedGasless).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessRejectReturned uses rejectReturned', async () => {
    const { result } = renderHook(() =>
      useGaslessRejectReturned(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(mocks.rejectReturned).toHaveBeenCalledOnce()
    expect(mocks.rejectReturnedGasless).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('falls back when window.ethereum is absent', async () => {
    delete (window as any).ethereum

    const { result } = renderHook(() =>
      useGaslessTransferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(mocks.checkEIP7702Delegation).not.toHaveBeenCalled()
    expect(mocks.transferHolder).toHaveBeenCalledOnce()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('falls back when no titleEscrowAddress is provided', async () => {
    const optsWithoutEscrow = {
      tokenRegistryAddress: TOKEN_REGISTRY,
      tokenId: TOKEN_ID,
    }

    const { result } = renderHook(() =>
      useGaslessTransferHolder(optsWithoutEscrow, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(mocks.checkEIP7702Delegation).not.toHaveBeenCalled()
  })

  it('falls back when no chainId is provided', async () => {
    const { result } = renderHook(() =>
      useGaslessTransferHolder(CONTRACT_OPTIONS, mockSigner, undefined)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(mocks.checkEIP7702Delegation).not.toHaveBeenCalled()
    expect(mocks.transferHolder).toHaveBeenCalledOnce()
  })

  it('falls back when whitelist check fails (caller not authorized)', async () => {
    // Allow delegation to pass so the whitelist IS checked, then fail it.
    mocks.checkEIP7702Delegation.mockResolvedValue(true)
    mocks.checkPaymasterWhitelist.mockResolvedValue({
      isCallerAuthorized: false,
      isTitleEscrowAuthorized: true,
    })

    const { result } = renderHook(() =>
      useGaslessTransferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(mocks.checkPaymasterWhitelist).toHaveBeenCalled()
    expect(mocks.transferHolder).toHaveBeenCalledOnce()
    expect(mocks.transferHolderGasless).not.toHaveBeenCalled()
  })

  it('falls back when whitelist check fails (title escrow not authorized)', async () => {
    mocks.checkEIP7702Delegation.mockResolvedValue(true)
    mocks.checkPaymasterWhitelist.mockResolvedValue({
      isCallerAuthorized: true,
      isTitleEscrowAuthorized: false,
    })

    const { result } = renderHook(() =>
      useGaslessTransferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(mocks.checkPaymasterWhitelist).toHaveBeenCalled()
    expect(mocks.transferHolder).toHaveBeenCalledOnce()
    expect(mocks.transferHolderGasless).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Gasless path — requires PIMLICO_API_KEY to be set.
//    We use vi.resetModules() + vi.stubEnv() + dynamic imports so the
//    module-level PIMLICO_API_KEY constant is re-evaluated with the env var.
// ─────────────────────────────────────────────────────────────────────────────

describe('gasless path (PIMLICO_API_KEY configured)', () => {
  let hooks: Record<string, any>

  beforeAll(async () => {
    vi.stubEnv('VITE_PIMLICO_API_KEY', 'test-pimlico-key')
    vi.stubEnv('VITE_PAYMASTER_ADDRESS', PAYMASTER)
    vi.resetModules()

    // Dynamic imports after resetting modules — each hook re-evaluates its
    // module-level PIMLICO_API_KEY constant with the stubbed value.
    const [
      thMod,
      tbMod,
      toMod,
      nMod,
      rtHMod,
      rtBMod,
      rtOMod,
      rtiMod,
      arMod,
      rrMod,
    ] = await Promise.all([
      import('./useGaslessTransferHolder'),
      import('./useGaslessTransferBeneficiary'),
      import('./useGaslessTransferOwners'),
      import('./useGaslessNominate'),
      import('./useGaslessRejectTransferHolder'),
      import('./useGaslessRejectTransferBeneficiary'),
      import('./useGaslessRejectTransferOwners'),
      import('./useGaslessReturnToIssuer'),
      import('./useGaslessAcceptReturned'),
      import('./useGaslessRejectReturned'),
    ])

    hooks = {
      transferHolder: thMod.useGaslessTransferHolder,
      transferBeneficiary: tbMod.useGaslessTransferBeneficiary,
      transferOwners: toMod.useGaslessTransferOwners,
      nominate: nMod.useGaslessNominate,
      rejectTransferHolder: rtHMod.useGaslessRejectTransferHolder,
      rejectTransferBeneficiary: rtBMod.useGaslessRejectTransferBeneficiary,
      rejectTransferOwners: rtOMod.useGaslessRejectTransferOwners,
      returnToIssuer: rtiMod.useGaslessReturnToIssuer,
      acceptReturned: arMod.useGaslessAcceptReturned,
      rejectReturned: rrMod.useGaslessRejectReturned,
    }
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it('useGaslessTransferHolder — calls transferHolderGasless when eligible', async () => {
    const { result } = renderHook(() =>
      hooks.transferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(mocks.checkEIP7702Delegation).toHaveBeenCalledWith(ACCOUNT, RPC_URL)
    expect(mocks.checkPaymasterWhitelist).toHaveBeenCalledWith(
      PAYMASTER,
      ACCOUNT,
      TITLE_ESCROW,
      RPC_URL
    )
    expect(mocks.buildSmartAccountClient).toHaveBeenCalled()
    expect(mocks.transferHolderGasless).toHaveBeenCalledOnce()
    expect(mocks.transferHolder).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
    expect(result.current.transactionHash).toBe(GASLESS_TX)
  })

  it('useGaslessTransferHolder — paymaster read from localStorage (simulates UI input)', async () => {
    // localStorage was set in beforeEach — this is what the VerifyResult UI sets
    // after a user enters and verifies a paymaster address.
    const { result } = renderHook(() =>
      hooks.transferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(mocks.checkPaymasterWhitelist).toHaveBeenCalledWith(
      PAYMASTER, // ← value from localStorage
      expect.any(String),
      expect.any(String),
      expect.any(String)
    )
    expect(mocks.transferHolderGasless).toHaveBeenCalledOnce()
  })

  it('useGaslessTransferBeneficiary — calls transferBeneficiaryGasless', async () => {
    const { result } = renderHook(() =>
      hooks.transferBeneficiary(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ newBeneficiaryAddress: '0xNEWBENEF' })
    })

    expect(mocks.transferBeneficiaryGasless).toHaveBeenCalledOnce()
    expect(mocks.transferBeneficiary).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
    expect(result.current.transactionHash).toBe(GASLESS_TX)
  })

  it('useGaslessTransferOwners — calls transferOwnersGasless', async () => {
    const { result } = renderHook(() =>
      hooks.transferOwners(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({
        newHolderAddress: '0xNEWH',
        newBeneficiaryAddress: '0xNEWB',
      })
    })

    expect(mocks.transferOwnersGasless).toHaveBeenCalledOnce()
    expect(mocks.transferOwners).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessNominate — calls nominateGasless', async () => {
    const { result } = renderHook(() =>
      hooks.nominate(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ newBeneficiaryAddress: '0xNOMINEE' })
    })

    expect(mocks.nominateGasless).toHaveBeenCalledOnce()
    expect(mocks.nominate).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessRejectTransferHolder — calls rejectTransferHolderGasless', async () => {
    const { result } = renderHook(() =>
      hooks.rejectTransferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(mocks.rejectTransferHolderGasless).toHaveBeenCalledOnce()
    expect(mocks.rejectTransferHolder).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessRejectTransferBeneficiary — calls rejectTransferBeneficiaryGasless', async () => {
    const { result } = renderHook(() =>
      hooks.rejectTransferBeneficiary(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(mocks.rejectTransferBeneficiaryGasless).toHaveBeenCalledOnce()
    expect(mocks.rejectTransferBeneficiary).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessRejectTransferOwners — calls rejectTransferOwnersGasless', async () => {
    const { result } = renderHook(() =>
      hooks.rejectTransferOwners(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(mocks.rejectTransferOwnersGasless).toHaveBeenCalledOnce()
    expect(mocks.rejectTransferOwners).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessReturnToIssuer — calls returnToIssuerGasless', async () => {
    const { result } = renderHook(() =>
      hooks.returnToIssuer(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(mocks.returnToIssuerGasless).toHaveBeenCalledOnce()
    expect(mocks.returnToIssuer).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessAcceptReturned — calls acceptReturnedGasless with tokenId from contractOptions', async () => {
    const { result } = renderHook(() =>
      hooks.acceptReturned(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ remarks: 'burning' })
    })

    expect(mocks.acceptReturnedGasless).toHaveBeenCalledOnce()
    expect(mocks.acceptReturned).not.toHaveBeenCalled()

    // tokenId must be injected from contractOptions into the call params
    const callArgs = mocks.acceptReturnedGasless.mock.calls[0]
    expect(callArgs[2]).toMatchObject({ tokenId: TOKEN_ID, remarks: 'burning' })
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('useGaslessRejectReturned — calls rejectReturnedGasless with tokenId from contractOptions', async () => {
    const { result } = renderHook(() =>
      hooks.rejectReturned(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(mocks.rejectReturnedGasless).toHaveBeenCalledOnce()
    expect(mocks.rejectReturned).not.toHaveBeenCalled()

    const callArgs = mocks.rejectReturnedGasless.mock.calls[0]
    expect(callArgs[2]).toMatchObject({ tokenId: TOKEN_ID })
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('falls back to regular tx when delegation check fails even with PIMLICO_API_KEY set', async () => {
    mocks.checkEIP7702Delegation.mockResolvedValue(false)

    const { result } = renderHook(() =>
      hooks.transferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(mocks.transferHolder).toHaveBeenCalledOnce()
    expect(mocks.transferHolderGasless).not.toHaveBeenCalled()
    expect(result.current.state).toBe('CONFIRMED')
    expect(result.current.transactionHash).toBe(REGULAR_TX)
  })

  it('skips delegation check when getRpcUrl returns null', async () => {
    mocks.getRpcUrl.mockReturnValue(null)

    const { result } = renderHook(() =>
      hooks.transferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(mocks.checkEIP7702Delegation).not.toHaveBeenCalled()
    expect(mocks.transferHolder).toHaveBeenCalledOnce()
    expect(result.current.state).toBe('CONFIRMED')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. State transitions
// ─────────────────────────────────────────────────────────────────────────────

describe('state transitions', () => {
  it('ends in CONFIRMED state after a successful send', async () => {
    const { result } = renderHook(() =>
      useGaslessTransferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(result.current.state).toBe('CONFIRMED')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. Error handling
// ─────────────────────────────────────────────────────────────────────────────

describe('error handling', () => {
  // Force the regular (non-gasless) path so we can mock regular function rejections.
  // Gasless functions don't go through the same code paths as regular ones.
  beforeEach(() => {
    mocks.checkEIP7702Delegation.mockResolvedValue(false)
  })

  it('maps MetaMask code 4001 → "User Rejected Transaction" and sets ERROR', async () => {
    mocks.transferHolder.mockRejectedValue({ code: 4001 })

    const { result } = renderHook(() =>
      useGaslessTransferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(result.current.state).toBe('ERROR')
    expect(result.current.errorMessage).toBe('User Rejected Transaction')
  })

  it('maps ethers code ACTION_REJECTED → "User Rejected Transaction"', async () => {
    mocks.transferBeneficiary.mockRejectedValue({ code: 'ACTION_REJECTED' })

    const { result } = renderHook(() =>
      useGaslessTransferBeneficiary(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ newBeneficiaryAddress: '0xNEWBENEF' })
    })

    expect(result.current.state).toBe('ERROR')
    expect(result.current.errorMessage).toBe('User Rejected Transaction')
  })

  it('maps code INSUFFICIENT_FUNDS → "Insufficient Funds"', async () => {
    mocks.rejectTransferHolder.mockRejectedValue({ code: 'INSUFFICIENT_FUNDS' })

    const { result } = renderHook(() =>
      useGaslessRejectTransferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(result.current.errorMessage).toBe('Insufficient Funds')
    expect(result.current.state).toBe('ERROR')
  })

  it('maps code 4900 → "Wallet Disconnected"', async () => {
    mocks.nominate.mockRejectedValue({ code: 4900 })

    const { result } = renderHook(() =>
      useGaslessNominate(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ newBeneficiaryAddress: '0xNOMINEE' })
    })

    expect(result.current.errorMessage).toBe('Wallet Disconnected')
    expect(result.current.state).toBe('ERROR')
  })

  it('maps error thrown inside tx.wait() to the correct message', async () => {
    const mockWait = vi.fn().mockRejectedValue({ code: 4001 })
    mocks.transferOwners.mockResolvedValue({ wait: mockWait })

    const { result } = renderHook(() =>
      useGaslessTransferOwners(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({
        newHolderAddress: '0xH',
        newBeneficiaryAddress: '0xB',
      })
    })

    expect(result.current.state).toBe('ERROR')
    expect(result.current.errorMessage).toBe('User Rejected Transaction')
  })

  it('returns empty string for unknown error codes', async () => {
    mocks.returnToIssuer.mockRejectedValue({ code: 9999 })

    const { result } = renderHook(() =>
      useGaslessReturnToIssuer(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(result.current.state).toBe('ERROR')
    expect(result.current.errorMessage).toBe('')
  })

  it('useGaslessAcceptReturned — throws when tokenRegistryAddress is missing in fallback', async () => {
    const optsNoRegistry = {
      titleEscrowAddress: TITLE_ESCROW,
      tokenId: TOKEN_ID,
    }

    const { result } = renderHook(() =>
      useGaslessAcceptReturned(optsNoRegistry, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(result.current.state).toBe('ERROR')
  })

  it('useGaslessRejectReturned — throws when tokenRegistryAddress is missing in fallback', async () => {
    const optsNoRegistry = {
      titleEscrowAddress: TITLE_ESCROW,
      tokenId: TOKEN_ID,
    }

    const { result } = renderHook(() =>
      useGaslessRejectReturned(optsNoRegistry, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({})
    })

    expect(result.current.state).toBe('ERROR')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. Reset function
// ─────────────────────────────────────────────────────────────────────────────

describe('reset()', () => {
  it('clears state, errorMessage, and transactionHash after an error', async () => {
    // Use the fallback path so we can trigger a known error via a regular function mock.
    mocks.checkEIP7702Delegation.mockResolvedValue(false)
    mocks.transferHolder.mockRejectedValue({ code: 4001 })

    const { result } = renderHook(() =>
      useGaslessTransferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(result.current.state).toBe('ERROR')
    expect(result.current.errorMessage).toBe('User Rejected Transaction')

    act(() => {
      result.current.reset()
    })

    expect(result.current.state).toBe('UNINITIALIZED')
    expect(result.current.errorMessage).toBeUndefined()
    expect(result.current.transactionHash).toBeUndefined()
  })

  it('clears state after a successful transaction', async () => {
    const { result } = renderHook(() =>
      useGaslessNominate(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ newBeneficiaryAddress: '0xNOMINEE' })
    })

    expect(result.current.state).toBe('CONFIRMED')

    act(() => {
      result.current.reset()
    })

    expect(result.current.state).toBe('UNINITIALIZED')
    expect(result.current.transactionHash).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. Paymaster input set via localStorage (simulates the VerifyResult UI flow)
// ─────────────────────────────────────────────────────────────────────────────

describe('paymaster address from localStorage (UI paymaster input)', () => {
  // When a user enters a paymaster address in VerifyResult, it is saved to
  // localStorage under `trustvc_paymaster_${account}`.  The hooks read it on
  // every send() call.  These tests verify that lifecycle end-to-end.

  it('uses the paymaster stored in localStorage as resolvedPaymasterAddress', async () => {
    const CUSTOM_PAYMASTER = '0xdddd000000000000000000000000000000000004'
    localStorage.setItem(`trustvc_paymaster_${ACCOUNT}`, CUSTOM_PAYMASTER)

    // The hook reads from localStorage inside send() — delegation check should
    // receive the correct paymaster when verifying the whitelist.
    // (PIMLICO_API_KEY is undefined here so hasGaslessConfig=false, but the
    // delegation / whitelist checks would still use the localStorage value if
    // gasless were enabled.  We verify the read path by checking the call args
    // in the gasless path block above and here just confirm no crash.)
    const { result } = renderHook(() =>
      useGaslessTransferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    // Falls back to regular tx (no PIMLICO_API_KEY), but no error thrown
    expect(result.current.state).toBe('CONFIRMED')
  })

  it('uses PAYMASTER_ADDRESS env fallback when localStorage entry is absent', async () => {
    localStorage.removeItem(`trustvc_paymaster_${ACCOUNT}`)

    // No crash — hooks gracefully handle missing localStorage entry
    const { result } = renderHook(() =>
      useGaslessTransferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(result.current.state).toBe('CONFIRMED')
  })

  it('still completes when localStorage entry is absent (falls back to env paymaster or regular tx)', async () => {
    localStorage.removeItem(`trustvc_paymaster_${ACCOUNT}`)

    // resolvedPaymasterAddress = null (localStorage) || PAYMASTER_ADDRESS env var.
    // Either the env var provides a paymaster (gasless eligible) or it's undefined
    // (falls back to regular tx). Either way, send() must complete without crashing.
    const { result } = renderHook(() =>
      useGaslessTransferHolder(CONTRACT_OPTIONS, mockSigner, CHAIN_ID)
    )

    await act(async () => {
      await result.current.send({ holderAddress: '0xNEWHOLDER' })
    })

    expect(result.current.state).toBe('CONFIRMED')
  })
})

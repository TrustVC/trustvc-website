// EIP-7702 delegation prefix in EOA bytecode
const EIP7702_PREFIX = '0xef0100'

/**
 * Returns true if the EOA at `userAddress` has delegated its bytecode
 * to an EIP-7702 implementation contract.
 */
export async function checkEIP7702Delegation(
  userAddress: string,
  rpcUrl: string
): Promise<boolean> {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getCode',
        params: [userAddress, 'latest'],
      }),
    })
    const { result } = (await response.json()) as { result?: string }
    return (
      typeof result === 'string' &&
      result.toLowerCase().startsWith(EIP7702_PREFIX)
    )
  } catch {
    return false
  }
}

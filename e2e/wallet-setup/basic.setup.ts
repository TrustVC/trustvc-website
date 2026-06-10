import { defineWalletSetup } from '@synthetixio/synpress'
import { MetaMask } from '@synthetixio/synpress/playwright'

const SEED_PHRASE =
  'test test test test test test test test test test test junk'
const PASSWORD = 'Tester@1234'

export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  const metamask = new MetaMask(context, walletPage, PASSWORD)

  // Import wallet — Account 1 = Hardhat account #0 (0xf39F...)
  await metamask.importWallet(SEED_PHRASE)

  // Add Hardhat Local network
  await metamask.addNetwork({
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 1337,
    symbol: 'ETH',
    blockExplorerUrl: '',
  })

  await metamask.switchNetwork('Hardhat Local')

  // Pre-add Account 2 (= Hardhat account #1) so reject tests can switch to it
  // without calling addMetaMaskAccount at runtime.
  await metamask.addNewAccount('Account 2')

  // Switch back to Account 1 as the default for all transfer tests
  await metamask.switchAccount('Account 1')
})

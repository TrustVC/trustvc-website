import { testWithSynpress } from '@synthetixio/synpress'
import { MetaMask, metaMaskFixtures } from '@synthetixio/synpress/playwright'
import BasicSetup from './wallet-setup/basic.setup'

const test = testWithSynpress(metaMaskFixtures(BasicSetup))
const { expect } = test

export { test, expect, MetaMask, BasicSetup }

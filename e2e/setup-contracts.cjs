const { ethers, Wallet } = require('ethers')
const ERC1967Proxy_artifact = require('./fixtures/ERC1967Proxy.json')

/**
 * IMPORTANT: This script uses only contract artifacts from @trustvc/trustvc
 * and avoids importing helper functions (deployTokenRegistry, mint) to prevent
 * ESM module errors in Node.js/GitHub Actions environments.
 *
 * The helper functions have dependencies that include ESM-only modules
 * (@digitalbazaar/bls12-381-multikey) which cannot be required() in CommonJS.
 *
 * Instead, we use direct ethers.js ContractFactory deployment and contract
 * interaction, which is more reliable in CI/CD environments.
 */
const v5Contracts = require('@trustvc/trustvc/token-registry-v5/contracts')

;(async () => {
  const {
    TDocDeployer__factory,
    TitleEscrowFactory__factory,
    TradeTrustToken__factory,
    TradeTrustTokenStandard__factory,
  } = v5Contracts // Remove ERC1967__factory from here

  // Hardhat default account #0 — always pre-funded with 10 000 ETH on any local node.
  // Private keys for local development and CI/CD only; hold no value on real networks.
  const DEPLOYER_KEY =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  // Hardhat default account #1 and #2 — used as token owner / holder addresses.
  const ADDRESS_EXAMPLE_1 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  const ADDRESS_EXAMPLE_2 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'

  const provider = new ethers.providers.JsonRpcProvider(
    'http://127.0.0.1:8545/',
    1337
  )
  const signer = new Wallet(DEPLOYER_KEY, provider)

  console.log('Deploying Title Escrow Factory...')
  // Deploy Title Escrow Factory
  const titleEscrowFactoryForStandalone = new ethers.ContractFactory(
    TitleEscrowFactory__factory.abi,
    TitleEscrowFactory__factory.bytecode,
    signer
  )
  const titleEscrowFactoryContractForStandalone =
    await titleEscrowFactoryForStandalone.deploy()
  await titleEscrowFactoryContractForStandalone.deployed()
  console.log(
    `Title Escrow Factory deployed at: ${titleEscrowFactoryContractForStandalone.address}`
  )

  console.log('Deploying Token Registry (standalone)...')
  // Deploy Token Registry (standalone mode)
  const tokenRegistryFactory = new ethers.ContractFactory(
    TradeTrustToken__factory.abi,
    TradeTrustToken__factory.bytecode,
    signer
  )
  const tokenRegistryContract = await tokenRegistryFactory.deploy(
    'DEMO TOKEN REGISTRY',
    'DTR',
    titleEscrowFactoryContractForStandalone.address
  )
  await tokenRegistryContract.deployed()
  console.log(`Token Registry deployed at: ${tokenRegistryContract.address}`)

  const tDocDeployerFactory = new ethers.ContractFactory(
    TDocDeployer__factory.abi,
    TDocDeployer__factory.bytecode,
    signer
  )
  const ERC1967ProxyFactory = new ethers.ContractFactory(
    ERC1967Proxy_artifact.abi,
    ERC1967Proxy_artifact.bytecode ||
      ERC1967Proxy_artifact.data.bytecode.object,
    signer
  ) // Standard Typechain output has .bytecode, older truffle/hardhat might have .data.bytecode.object
  const titleEscrowFactory = new ethers.ContractFactory(
    TitleEscrowFactory__factory.abi,
    TitleEscrowFactory__factory.bytecode,
    signer
  )
  const tokenImplementation = new ethers.ContractFactory(
    TradeTrustTokenStandard__factory.abi,
    TradeTrustTokenStandard__factory.bytecode,
    signer
  )
  const tDocDeployerFactoryContract = await tDocDeployerFactory.deploy()
  const ERC1967ProxyFactoryContract = await ERC1967ProxyFactory.deploy(
    tDocDeployerFactoryContract.address,
    '0x8129fc1c'
  )
  const titleEscrowFactoryContract = await titleEscrowFactory.deploy()
  const tokenImplementationContract = await tokenImplementation.deploy()

  // addresses are same when executed for the first time after blockchain node is started.
  // const TOKEN_IMPLEMENTATION_ADDRESS = "0x0952a6817E00fc2455418a5303395760A9c4EE71"; //tokenImplementationContract.address
  // const TITLE_ESCROW_FACTORY_ADDRESS2 = "0x547Ca63C8fB3Ccb856DEb7040D327dBfe4e7d20F"; //titleEscrowFactoryContract.address;
  // const TDOC_DEPLOYER_ADDRESS = "0xfE442b75786c67E1e7a7146DAeD8943F0f2c23d2"; //tDocDeployerFactoryContract.address
  // const ERC1967_PROXY_ADDRESS2 = "0x3488EAA1bF4f606f758b24F5ef6eb2a1E32335be"; //ERC1967ProxyFactoryContract.address

  const tDocDeployerThroughProxy = new ethers.Contract(
    ERC1967ProxyFactoryContract.address,
    TDocDeployer__factory.abi,
    signer
  )
  const addImplementationTx = await tDocDeployerThroughProxy.addImplementation(
    tokenImplementationContract.address,
    titleEscrowFactoryContract.address
  )

  await addImplementationTx.wait()

  // --- End TDoc Deployer Setup

  const defaultToken = {
    accountKey: DEPLOYER_KEY,
    tokenRegistryAddress: tokenRegistryContract.address, // Use the deployed contract address
    owner: ADDRESS_EXAMPLE_1,
    holder: ADDRESS_EXAMPLE_1,
  }
  const nominateToken = {
    accountKey: DEPLOYER_KEY,
    tokenRegistryAddress: tokenRegistryContract.address, // Use the deployed contract address
    owner: ADDRESS_EXAMPLE_1,
    holder: ADDRESS_EXAMPLE_2,
  }

  const tokensToMint = {
    tokenRegistry: [
      {
        // Transfer/Reject Holder
        tokenId:
          '0xecb542b947553af17be191b445d28133a7c9e74de54ea3e27373c8421ce8e8fd',
        ...defaultToken,
      },
      {
        // Transfer/reject beneficiary (holder)
        tokenId:
          '0xa358b0a7df13a1377a9ce8a082ccbe95c9fd700b8c0b764ca94375b44d8942a5',
        ...defaultToken,
      },
      {
        //Transfer/reject owners
        tokenId:
          '0xe363ffeecb561c940f74e01c6a4a21154ad91cf71eaba09ec1ba44dc32c204de',
        ...defaultToken,
      },
      {
        // Surrender/reject surrender
        tokenId:
          '0x8c67260e6f796368a680742e409d5fada0c58ac1abaa9baf38e9ebeacb7caf93',
        ...defaultToken,
      },
      {
        // Surrender/accept surrender
        tokenId:
          '0x08c94837a51152b18287ec2304c1115c4611b530f8a18290de2fe4192b22df9b',
        ...defaultToken,
      },
      {
        //nominate
        tokenId:
          '0xc028b0a92ed3283146ef0e35d2f15845d38d7d4b736b14d938b0500d97a8426d',
        ...nominateToken,
      },
    ],
  }

  // Mint tokens using direct contract interaction
  console.log('Minting tokens...')
  const tokenRegistryForMinting = new ethers.Contract(
    tokenRegistryContract.address,
    TradeTrustTokenStandard__factory.abi,
    signer
  )

  for (const element of tokensToMint.tokenRegistry) {
    console.log(`Minting token ${element.tokenId}...`)
    try {
      const tx = await tokenRegistryForMinting.mint(
        element.owner,
        element.holder,
        element.tokenId,
        '0x'
      )
      await tx.wait()
      console.log(`Token ${element.tokenId} minted successfully`)
    } catch (error) {
      console.error(`Failed to mint token ${element.tokenId}:`, error.message)
      throw error
    }
  }

  console.log('\n=== Contract Setup Complete ===')
  console.log(
    `Title Escrow Factory: ${titleEscrowFactoryContractForStandalone.address}`
  )
  console.log(`Token Registry: ${tokenRegistryContract.address}`)
  console.log(`TDoc Deployer (Proxy): ${ERC1967ProxyFactoryContract.address}`)
  console.log(`Token Implementation: ${tokenImplementationContract.address}`)
  console.log(
    `Title Escrow Factory (V5): ${titleEscrowFactoryContract.address}`
  )
})()

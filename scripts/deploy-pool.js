// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
require('dotenv').config()
const hre = require("hardhat");
const requireOrMock = require('require-or-mock');
const ethers = hre.ethers
const deployed = requireOrMock('export/deployed.json')
const DeployUtils = require('./lib/DeployUtils')
let deployUtils

async function main() {
  deployUtils = new DeployUtils(ethers)
  const chainId = await deployUtils.currentChainId()
  console.log('chainId', chainId)

  const [owner] = await ethers.getSigners()

  const {SYN_PER_BLOCK, BLOCK_PER_UPDATE, BLOCK_MULTIPLIER, QUICK_REWARDS, WEIGHT} = process.env
  if (!SYN_PER_BLOCK || !BLOCK_PER_UPDATE || !BLOCK_MULTIPLIER || !QUICK_REWARDS || !WEIGHT) {
    throw new Error('Missing parameters')
  }


  const synAddress = deployed[chainId].SyndicateERC20
  const ssynAddress = deployed[chainId].EscrowedSyndicateERC20
  console.log('Deployment started')
  const PoolFactory = await ethers.getContractFactory("SyndicatePoolFactory")
  const blockNumberFactoryConstructor = (await ethers.provider.getBlockNumber() + 40)
  const poolFactory = await PoolFactory.deploy(
      synAddress,
      ssynAddress,
      ethers.utils.parseEther(SYN_PER_BLOCK),
      ethers.BigNumber.from(BLOCK_PER_UPDATE),
      blockNumberFactoryConstructor,
      blockNumberFactoryConstructor + parseInt(BLOCK_MULTIPLIER)
  );
  await poolFactory.deployed()
  console.log('SyndicatePoolFactory deployed at', poolFactory.address)

  const blockNumberPoolCreation = await ethers.provider.getBlockNumber()
  const tx = await poolFactory.connect(owner).createPool(synAddress, blockNumberPoolCreation, WEIGHT)
  await tx.wait()

  const synPoolAddress = await poolFactory.getPoolAddress(synAddress)
  const corePool = await deployUtils.getContract('SyndicateCorePool', 'pools', synPoolAddress, chainId)
  console.log('SyndicateCorePool deployed at', corePool.address)

  await corePool.connect(owner).setQuickReward(ethers.BigNumber.from(process.env.QUICK_REWARDS))
  console.log('Quick reward set')

  const SYN = await ethers.getContractFactory("SyndicateERC20")
  const syn = await SYN.attach(deployed[chainId].SyndicateERC20)

  const SSYN = await ethers.getContractFactory("EscrowedSyndicateERC20")
  const ssyn = await SSYN.attach(deployed[chainId].EscrowedSyndicateERC20)

  await ssyn.connect(owner).updateRole(corePool.address, await syn.ROLE_TOKEN_CREATOR()); // 9
  console.log('Pool authorized to manage sSYN')

  await deployUtils.saveDeployed(chainId,
      ['SyndicatePoolFactory', 'SyndicateCorePool'],
      [poolFactory.address, corePool.address],
      {
        blockNumberFactoryConstructor,
        blockNumberPoolCreation
      }
  )

}

main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });


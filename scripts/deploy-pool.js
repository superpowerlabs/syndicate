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
  const [owner] = await ethers.getSigners()

  const {SYN_PER_BLOCK, BLOCK_PER_UPDATE, BLOCK_MULTIPIER, QUICK_REWARDS} = process.env
  if (!SYN_PER_BLOCK || !BLOCK_PER_UPDATE || !BLOCK_MULTIPIER || !QUICK_REWARDS) {
    throw new Error('Missing parameters')
  }

  const synAddress = deployed[chainId].SyndicateERC20
  const PoolFactory = await ethers.getContractFactory("SyndicatePoolFactory")
  const poolFactory = await PoolFactory.deploy(
      synAddress,
      deployed[chainId].EscrowedSyndicateERC20,
      ethers.utils.parseEther(SYN_PER_BLOCK),
      ethers.BigNumber.from(BLOCK_PER_UPDATE),
      await ethers.provider.getBlockNumber(),
      (await ethers.provider.getBlockNumber()) + parseInt(BLOCK_MULTIPIER)
  );
  await poolFactory.deployed()
  console.log('SyndicatePoolFactory deployed at', poolFactory.address)
  await poolFactory.createPool(synAddress, await ethers.provider.getBlockNumber(), 1);

  const corePoolAddress = await poolFactory.getPoolAddress(synAddress)
  const SyndicateCorePool = await ethers.getContractFactory("SyndicateCorePool")
  const corePool = await SyndicateCorePool.attach(corePoolAddress)
  await corePool.deployed()
  console.log('SyndicateCorePool deployed at', corePool.address)
  corePool.setQuickReward(ethers.BigNumber.from(QUICK_REWARDS))

  const syn = deployUtils.getContract('SyndicateERC20', deployed[chainId].SyndicateERC20, chainId)
  const ssyn = deployUtils.getContract('EscrowedSyndicateERC20', deployed[chainId].EscrowedSyndicateERC20, chainId)
  await ssyn.connect(owner).updateRole(corePoolAddress, await syn.ROLE_TOKEN_CREATOR()); // 9

  await deployUtils.saveDeployed(chainId,
      ['SyndicatePoolFactory', 'SyndicateCorePool'],
      [poolFactory.address, corePool.address]
  )

}

main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });


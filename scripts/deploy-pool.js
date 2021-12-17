// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
require('dotenv').config()
const {assert} = require("chai")
const hre = require("hardhat");
const fs = require('fs-extra')
const path = require('path')
const requireOrMock = require('require-or-mock');
const ethers = hre.ethers
const deployed = requireOrMock('export/deployed.json')

async function currentChainId() {
  return (await ethers.provider.getNetwork()).chainId
}

function normalize(val, n = 18) {
  return '' + val + '0'.repeat(n)
}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const chainId = await currentChainId()
  const isLocalNode = /1337$/.test(chainId)

  let [owner, user1, user2] = await ethers.getSigners();

  // deploy the pool

  const synAddress = deployed[chainId].SyndicateERC20
  const PoolFactory = await ethers.getContractFactory("SyndicatePoolFactory")
  // console.log('pool fact')
  // console.log(PoolFactory)
  //   console.log("logging block number ")
  //   console.log(await ethers.provider.getBlockNumber)
  const poolFactory = await PoolFactory.deploy(
      synAddress,
      deployed[chainId].EscrowedSyndicateERC20,
      ethers.utils.parseEther('5000'), // synPerBlock
      100000000, // blockPerUpdate, decrease reward by 3%
      await ethers.provider.getBlockNumber(),
      await ethers.provider.getBlockNumber() + 10000000
  );
  await poolFactory.deployed()
  await poolFactory.createPool(synAddress, await ethers.provider.getBlockNumber(), 1);

  const corePoolAddress = await poolFactory.getPoolAddress(synAddress)
  const SyndicateCorePool = await ethers.getContractFactory("SyndicateCorePool")
  const corePool = await SyndicateCorePool.attach(corePoolAddress)
  corePool.setQuickReward(99999)

  const addresses = {
    SyndicatePoolFactory: poolFactory.address,
    SyndicateCorePool: corePool.address
  }

  if (!deployed[chainId]) {
    deployed[chainId] = {}
  }
  deployed[chainId] = Object.assign(deployed[chainId], addresses)

  console.log(deployed)

  const deployedJson = path.resolve(__dirname, '../export/deployed.json')
  await fs.ensureDir(path.dirname(deployedJson))
  await fs.writeFile(deployedJson, JSON.stringify(deployed, null, 2))

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });


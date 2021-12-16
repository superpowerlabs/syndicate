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
const os = require("os");

const envFilePath = path.resolve(__dirname, "../.env");
// read .env file & convert to array
const readEnvVars = () => fs.readFileSync(envFilePath, "utf-8").split(os.EOL);

const getEnvValue = (key) => {
  const matchedLine = readEnvVars().find((line) => line.split("=")[0] === key);
  return matchedLine !== undefined ? matchedLine.split("=")[1] : null;
};
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
 const PoolFactory = await ethers.getContractFactory("SyndicatePoolFactory")
 console.log(ethers.utils.parseEther('5000'))
 console.log("logging block number ")
 console.log(await ethers.provider.getBlockNumber)
 const syn = (getEnvValue('SYNADRESS'))
 const ssyn = (getEnvValue('SSYNADRESS'))
 console.log(syn)
 console.log(ssyn)
 const poolFactory = await PoolFactory.deploy(
     syn,
     ssyn,
     //ethers.utils.parseEther('5000'), // synPerBlock
     normalize(5000),
     100000000, // blockPerUpdate, decrease reward by 3%
     await ethers.provider.getBlockNumber(),
     await ethers.provider.getBlockNumber() + 10000000
 );

 await poolFactory.deployed()

 await poolFactory.createPool(syn.address, await ethers.provider.getBlockNumber(), 1);

 const corePoolAddress = await poolFactory.getPoolAddress(syn.address)
 const SyndicateCorePool = await ethers.getContractFactory("SyndicateCorePool")
 const corePool = await SyndicateCorePool.attach(corePoolAddress)
 corePool.setQuickReward(99999)

 const addresses = {
   EscrowedSyndicateERC20: ssyn.address,
   SyndicateERC20: syn.address,
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
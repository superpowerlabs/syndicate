require('dotenv').config()
const hre = require("hardhat");
const ethers = hre.ethers

const DeployUtils = require('./lib/DeployUtils')
let deployUtils

async function main() {
  deployUtils = new DeployUtils(ethers)
  const chainId = await deployUtils.currentChainId()
  const SSYN = await ethers.getContractFactory("EscrowedSyndicateERC20")
  const ssyn = await SSYN.deploy()
  await ssyn.deployed()
  console.log('EscrowedSyndicateERC20 deployed at', ssyn.address)
  await deployUtils.saveDeployed(chainId, ['EscrowedSyndicateERC20'], [ssyn.address])
}

main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });

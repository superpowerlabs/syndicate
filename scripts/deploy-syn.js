require('dotenv').config()
const hre = require("hardhat");
const ethers = hre.ethers

const DeployUtils = require('./lib/DeployUtils')
let deployUtils

async function main() {
  deployUtils = new DeployUtils(ethers)
  const chainId = await deployUtils.currentChainId()
  let [owner] = await ethers.getSigners();

  if (!process.env.MAX_TOTAL_SUPPLY) {
    throw new Error('Missing parameters')
  }

  console.log('Deployment started')
  const SYN = await ethers.getContractFactory("SyndicateERC20")
  const syn = await SYN.deploy(owner.address, process.env.MAX_TOTAL_SUPPLY)
  await syn.deployed()
  console.log('SyndicateERC20 deployed at', syn.address)

  let features =
      (await syn.FEATURE_TRANSFERS_ON_BEHALF()) +
      (await syn.FEATURE_TRANSFERS()) +
      (await syn.FEATURE_UNSAFE_TRANSFERS()) +
      (await syn.FEATURE_DELEGATIONS()) +
      (await syn.FEATURE_DELEGATIONS_ON_BEHALF())

  await syn.updateFeatures(features)
  // await syn.transfer(user1.address, ethers.utils.parseEther('20000'));
  await deployUtils.saveDeployed(chainId, ['SyndicateERC20'], [syn.address])
}

main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });

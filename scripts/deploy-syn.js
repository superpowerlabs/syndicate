require('dotenv').config()
const hre = require("hardhat");
const ethers = hre.ethers

const DeployUtils = require('./lib/DeployUtils')
const {expect} = require('chai');
const deployed = require('../export/deployed.json');
let deployUtils

const grantees = [
  '0x70f41fE744657DF9cC5BD317C58D3e7928e22E1B',
  '0x16244cdFb0D364ac5c4B42Aa530497AA762E7bb3',
  '0xe360cDb9B5348DB79CD630d0D1DE854b44638C64'
]
// must be adjusted to the negotiated values
const grantPoints = [120, 100, 140] // 120 = 1.2%

function normalize(val, n = 18) {
  return '' + val + '0'.repeat(n)
}

async function main() {
  deployUtils = new DeployUtils(ethers)
  const chainId = await deployUtils.currentChainId()
  let [owner] = await ethers.getSigners();
  let tx;

  if (!process.env.MAX_TOTAL_SUPPLY) {
    throw new Error('Missing parameters')
  }

  console.log('Deploying SyndicateERC20...')
  const SYN = await ethers.getContractFactory("SyndicateERC20")
  const syn = await SYN.deploy(owner.address, process.env.MAX_TOTAL_SUPPLY)
  await syn.deployed()
  console.log('SyndicateERC20 deployed at', syn.address)

  let notReallyDeployedYet = true
  let features

  // if the network is congested the following can fail
  while (notReallyDeployedYet) {
    try {
      features =
          (await syn.FEATURE_TRANSFERS_ON_BEHALF()) +
          (await syn.FEATURE_TRANSFERS()) +
          (await syn.FEATURE_UNSAFE_TRANSFERS()) +
          (await syn.FEATURE_DELEGATIONS()) +
          (await syn.FEATURE_DELEGATIONS_ON_BEHALF())
      notReallyDeployedYet = false
    } catch (e) {
      await deployUtils.sleep(1000)
    }
  }
  const network = chainId === 1 ? 'ethereum'
      : chainId == 42 ? 'kovan'
          : 'localhost'

  console.log(`
To verify SyndicateERC20 source code:
    
  npx hardhat verify --show-stack-traces \\
      --network ${network} \\
      ${syn.address} \\
      ${owner.address} \\
      ${process.env.MAX_TOTAL_SUPPLY}
      
`)

  await (await syn.updateFeatures(features)).wait()

  console.log('Deploying TeamVesting...')
  const Vesting = await ethers.getContractFactory("TeamVesting")
  const vesting = await Vesting.deploy(syn.address, 365 + 31)
  console.log('TeamVesting deployed at', vesting.address)
  await vesting.deployed()

  console.log(`
To verify TeamVesting source code:
    
  npx hardhat verify --show-stack-traces \\
      --network ${network} \\
      ${vesting.address} \\
      ${syn.address} \\
      396
      
`)

  notReallyDeployedYet = true
  while (notReallyDeployedYet) {
    try {
      await vesting.cliff()
      notReallyDeployedYet = false
    } catch (e) {
      await deployUtils.sleep(1000)
    }
  }
  const grants = []
  const maxSupply = ethers.BigNumber.from(normalize(process.env.MAX_TOTAL_SUPPLY))

  for (let i = 0; i < grantPoints.length; i++) {
    let fullGrant = maxSupply.div(10000).mul(grantPoints[i])
    // in total is 36 1/9 %
    grants[i] = fullGrant.mul(36).div(100).add(fullGrant.div(900))
  }

  const totalRewards = grants.reduce((a, b) => {
    return a.add(b)
  }, ethers.BigNumber.from('0'))

  await (await syn.connect(owner).transfer(vesting.address, totalRewards)).wait()

  await (await vesting.init(grantees, grants)).wait()
  await deployUtils.saveDeployed(chainId, ['SyndicateERC20', 'TeamVesting'], [syn.address, vesting.address])
}

main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });

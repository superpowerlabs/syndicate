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

  let [, localTokenOwner, localSuperAdmin] = await ethers.getSigners();

  const tokenOwner = chainId === '1337'
      ? localTokenOwner.address
      : process.env.TOKEN_OWNER

  const superAdmin = chainId === '1337'
      ? localSuperAdmin.address
      : process.env.SUPER_ADMIN

  const synAddress = deployed[chainId].SyndicateERC20
  const ssynAddress = deployed[chainId].EscrowedSyndicateERC20
  console.log('Deploying SynSwapper')
  const SynSwapper = await ethers.getContractFactory("SynSwapper")
  const synSwapper = await SynSwapper.deploy(
      superAdmin,
      synAddress,
      ssynAddress);
  await synSwapper.deployed()
  console.log('SynSwapper deployed at', synSwapper.address)

  const network = chainId === 1 ? 'ethereum'
      : chainId == 42 ? 'kovan'
          : 'localhost'

  console.log(`
To verify SynSwapper source code:
    
  npx hardhat verify --show-stack-traces \\
      --network ${network} \\
      ${synSwapper.address} \\
      ${superAdmin} \\
      ${synAddress} \\
      ${ssynAddress}
      
`)

  await deployUtils.saveDeployed(chainId,
      ['SynSwapper'],
      [synSwapper.address]
  )

}

main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });


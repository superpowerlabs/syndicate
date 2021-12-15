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
const requireOrMock = require('require-or-mock')
const ethers = hre.ethers

const deployed = requireOrMock('export/deployed.json')

async function currentChainId() {
  return (await ethers.provider.getNetwork()).chainId
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
  const [deployer] = await ethers.getSigners()

  if (!deployed[chainId].SynCityCoupons) {
    console.error('It looks like SynCityCoupons has not been deployed on this network')
    process.exit(1)
  }

  const couponABI = require('../artifacts/contracts/SynCityCoupons.sol/SynCityCoupons.json').abi

  const couponNft = new ethers.Contract(deployed[chainId].SynCityCoupons, couponABI, deployer)

  console.log("Deploying contracts with the account:", deployer.address)

  console.log('Current chain ID', await currentChainId())

  console.log("Account balance:", (await deployer.getBalance()).toString());

    const validator = isLocalNode
      ? '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' // hardhat #4
      : process.env.VALIDATOR

  assert.isTrue(validator.length === 42)

  const SynCityBlueprints = await ethers.getContractFactory("SynCityBlueprints")
  const nft = await SynCityBlueprints.deploy()
  await nft.deployed()

  const addresses = {
    SynCityBlueprints: nft.address
  }

  const SynCitySwapper = await ethers.getContractFactory("SynCitySwapper")
  const swapper = await SynCitySwapper.deploy(
      addresses.SynCityBlueprints,
      deployed[chainId].SynCityCoupons,
      validator
  )
  await swapper.deployed()

  addresses.SynCitySwapper = swapper.address

  await couponNft.setSwapper(swapper.address)

  if (!deployed[chainId]) {
    deployed[chainId] = {}
  }
  deployed[chainId] = Object.assign(deployed[chainId], addresses)

  console.log(deployed)

  const deployedJson = path.resolve(__dirname, '../export/deployed.json')
  await fs.ensureDir(path.dirname(deployedJson))
  await fs.writeFile(deployedJson, JSON.stringify(deployed, null, 2))

  const tmpDir = path.resolve(__dirname, '../tmp/SynCityBlueprints')
  await fs.ensureDir(tmpDir)
  await fs.writeFile(path.join(tmpDir, chainId.toString()), addresses.SynCityBlueprints)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });


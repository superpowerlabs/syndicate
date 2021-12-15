// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
require('dotenv').config()
const {assert, expect} = require("chai")
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
  const [deployer, marketplace] = await ethers.getSigners()

  if (!deployed[chainId].SynCityCoupons) {
    console.error('It looks like SynCityCoupons has not been deployed on this network')
    process.exit(1)
  }

  const couponABI = require('../artifacts/contracts/SynCityCoupons.sol/SynCityCoupons.json').abi
  const couponNft = new ethers.Contract(deployed[chainId].SynCityCoupons, couponABI, deployer)

  const target = chainId === 1337 ? marketplace.address : process.env.BINANCE_ADDRESS

  if (!target) {
    console.log('Marketplace address not found')
    process.exit()
  }

  console.log('Setting marketplace...')

  await expect (await couponNft.setDepositAddress(target))
      .to.emit(couponNft, 'DepositAddressSet')
      .withArgs(target)

  console.log('Marketplace set to', target)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });


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

  console.log('Transferring')

  const mintEnded = await couponNft.mintEnded()

  if (!mintEnded) {
    console.log('Minting not ended yet')
    process.exit()
  }
  let quantity = chainId === 1337 ? 20 : 17

  quantity = 5

  const maxSupply = (await couponNft.maxSupply()).toNumber()

  const target = chainId === 1337 ? marketplace.address : process.env.BINANCE_ADDRESS

  while (true) {
    const ownerBalance = (await couponNft.balanceOf(deployer.address)).toNumber()
    const balance = (await couponNft.balanceOf(target)).toNumber()
    if (balance === maxSupply - 8) {
      console.log('Batch transfer completed. Finish it manually')
      process.exit()
    } else if (ownerBalance === 0) {
      console.log('Owner does not have enough token')
    } else {
      if (ownerBalance - quantity < 12) {
        quantity = ownerBalance
      }
      console.log('Owner balance:', ownerBalance)
      try {
        await (await couponNft.batchTransfer(quantity, {
          gasLimit: 5000000
        })).wait()
        console.log('Transferred', quantity, 'tokens')
      } catch (e) {
        console.log('Transaction failed. Trying again')
        console.error(e)
      }
    }
    await new Promise(resolve => setTimeout(resolve, chainId === 1337 ? 5000 : 10000))
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });


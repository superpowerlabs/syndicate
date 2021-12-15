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
const {abi: couponABI} = require('../artifacts/contracts/SynCityCoupons.sol/SynCityCoupons.json');
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
  const [deployer] = await ethers.getSigners()

  if (!deployed[chainId].SynCityCoupons) {
    console.error('It looks like SynCityCoupons has not been deployed on this network')
    process.exit(1)
  }

  const couponABI = require('../artifacts/contracts/SynCityCoupons.sol/SynCityCoupons.json').abi
  const couponNft = new ethers.Contract(deployed[chainId].SynCityCoupons, couponABI, deployer)

  let quantity = chainId === 1337 ? 20 : 40
  const maxSupply = (await couponNft.maxSupply()).toNumber()

  while (true) {
    const balance = (await couponNft.balanceOf(deployer.address)).toNumber()
    console.log('Current balance:', balance)
    if (balance === maxSupply) {
      console.log('Minting completed')
      process.exit()
    } else {
      if (balance + quantity > maxSupply) {
        quantity = maxSupply - balance
      }
      console.log('Minting new batch of', quantity, '...')
      try {
        await (await couponNft.selfSafeMint(quantity, {
          gasLimit: 5000000
        })).wait()
        console.log('Minted', quantity, 'tokens')
      } catch(e) {
        console.log('Transaction failed. Trying again')
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


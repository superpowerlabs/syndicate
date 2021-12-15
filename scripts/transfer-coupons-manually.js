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

async function sleep(millis) {
  // eslint-disable-next-line no-undef
  return new Promise(resolve => setTimeout(resolve, millis))
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
  let quantity = chainId === 1337 ? 20 : 40

  quantity = 1

  // const maxSupply = (await couponNft.maxSupply()).toNumber()

  const target = chainId === 1337 ? marketplace.address : process.env.BINANCE_ADDRESS

  for  (let i=3;i< 7999;i++) {
    try {
      await couponNft.safeTransferFrom('0x6958De0121F4452FD10f43d2084f851019453794',
          '0xe0a9e5b59701a776575fdd6257c3f89ae362629a', ethers.BigNumber.from(i))
      console.log('Transferring', i)
    } catch (e) {
      console.log('Transaction failed. Trying again')
      console.error(e)
    }
    if (!i%10) {
      console.log('waiting')
      await sleep(20000)
    }
  }

  process.exit()



  while (true) {
    const ownerBalance = (await couponNft.balanceOf(deployer.address)).toNumber()
    const balance = (await couponNft.balanceOf(target)).toNumber()
    if (balance === maxSupply) {
      console.log('Batch transfer completed')
      process.exit()
    } else if (ownerBalance === 0) {
      console.log('Owner does not have enough token')
    } else {
      if (ownerBalance - quantity < 0) {
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
    break
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


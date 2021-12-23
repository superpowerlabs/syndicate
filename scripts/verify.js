require('dotenv').config()
const ethers = require('ethers')
const envJson = require('../.env.json')
const deployed = require('../export/deployed.json')

let [, , what, network, synPerBlock, blockPerUpdate, blockMultiplier] = process.argv
const chainId = network === 'localhost'
    ? 1337
    : network === 'kovan' ? 42
        : 1

let owner = chainId === 1337
    ? '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    : (new ethers.Wallet(envJson.kovan.privateKey)).address

let cmd
switch (what) {

  case 'ssyn':
    cmd = `npx hardhat verify --show-stack-traces \\
      --network ${network} \\
      ${deployed[chainId].EscrowedSyndicateERC20}`
    break

  case 'syn':
    cmd = `npx hardhat verify --show-stack-traces \\
      --network ${network} \\
      ${deployed[chainId].SyndicateERC20} \\
      ${owner}`
    break

  case 'pool':
    const synAddress = deployed[chainId].SyndicateERC20
    const ssynAddress = deployed[chainId].EscrowedSyndicateERC20
    synPerBlock = ethers.utils.parseEther(synPerBlock).toString()
    const blockNumberFactoryConstructor = deployed.extras[chainId].blockNumberFactoryConstructor
    const sumBlock = blockNumberFactoryConstructor + parseInt(blockMultiplier)
    cmd = `npx hardhat verify --show-stack-traces \\
      --network ${network} \\
      ${deployed[chainId].SyndicatePoolFactory} \\
      ${synAddress} \\
      ${ssynAddress} \\
      ${synPerBlock} \\
      ${blockPerUpdate} \\
      ${blockNumberFactoryConstructor} \\
      ${sumBlock}`
    break

  // case 'core':
  //   const synAddress = deployed[chainId].SyndicateERC20
  //   const ssynAddress = deployed[chainId].EscrowedSyndicateERC20
  //   synPerBlock = ethers.utils.parseEther(synPerBlock).toString()
  //   const blockNumberFactoryConstructor = deployed.extras[chainId].blockNumberFactoryConstructor
  //   const sumBlock = blockNumberFactoryConstructor + parseInt(blockMultiplier)
  //   cmd = `npx hardhat verify --show-stack-traces \\
  //     --network ${network} \\
  //     ${deployed[chainId][what]} \\
  //     ${synAddress} \\
  //     ${ssynAddress} \\
  //     ${synPerBlock} \\
  //     ${blockPerUpdate} \\
  //     ${blockNumberFactoryConstructor} \\
  //     ${sumBlock}`
  //   break
}


console.log(cmd)

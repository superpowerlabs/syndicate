#!/usr/bin/env node
const {assert} = require('chai');
require('dotenv').config()
const [,,network, chainId] = process.argv
const deployed = require('../export/deployed.json')[chainId]

const isLocalNode = /1337$/.test(chainId)
const validator = isLocalNode
    ? '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' // hardhat #4
    : process.env.VALIDATOR

assert.isTrue(validator.length === 42)
// assert.isTrue(operator.length === 42)

const maxTokenId = process.env.MAX_TOKEN_ID || 888

const cmd =`npx hardhat verify \\
  --contract contracts/SynCityPasses.sol:SynCityPasses \\
  --show-stack-traces \\
  --network ${network} \\
  ${deployed.SynCityPasses} \\
  ${validator}
`

console.log(cmd)

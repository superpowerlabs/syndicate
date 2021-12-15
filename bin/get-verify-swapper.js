#!/usr/bin/env node
require('dotenv').config()
const [,,network] = process.argv
const chainId = network === 'bsc' ? '56' : '97'
const deployed = require('../export/deployed.json')[chainId]

const cmd =`npx hardhat verify --show-stack-traces \\
  --network ${network} \\
  ${deployed.SynCitySwapper} \\
  ${deployed.SynCityBlueprints} \\
  ${deployed.SynCityCoupons} \\
  ${process.env.VALIDATOR}
`

console.log(cmd)

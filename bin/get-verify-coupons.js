#!/usr/bin/env node
require('dotenv').config()
const [,,network] = process.argv
const chainId = network === 'bsc'
    ? '56'
    : network === 'rinkeby'
        ? '4'
        : '97'
const maxSupply = network === 'bsc' ? 8000 : 50
const deployed = require('../export/deployed.json')[chainId]

const cmd =`npx hardhat verify --show-stack-traces \\
  --network ${network} \\
  ${deployed.SynCityCoupons} \\
  ${maxSupply}
`

console.log(cmd)

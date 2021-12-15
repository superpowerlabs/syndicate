#!/usr/bin/env bash

const cmd =`npx hardhat verify --show-stack-traces \\
  --network rinkeby \\
  0xab62c34BB4041C84F65bC08741075f5fb67F5824 \\
  "https://blueprints.syn.city/meta/SYNP/" \\
  0x34923658675B99B2DB634cB2BC0cA8d25EdEC743
`

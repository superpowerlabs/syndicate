#!/usr/bin/env bash

npx hardhat verify --show-stack-traces \
  --network $1 \
  0x06E59f4C058b1b2454614b900558991a067ce115 \
  "https://nft.syn.city/meta/SYNP/" \
  0x34923658675B99B2DB634cB2BC0cA8d25EdEC743

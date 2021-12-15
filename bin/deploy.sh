#!/usr/bin/env bash
# must be run from the root

rm -rf artifacts
rm -rf cache
npx hardhat compile
npx hardhat run scripts/deploy-$1.js --network $2

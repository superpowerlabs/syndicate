#!/usr/bin/env bash
# must be run from the root

rm -rf artifacts
rm -rf cache
npx hardhat compile

if [[ "$1" == "pool" ]]; then
# bin/deploy.sh pool-factory localhost 5000 100000000 10000000
  SYN_PER_BLOCK=$3 BLOCK_PER_UPDATE=$4 BLOCK_MULTIPLIER=$5 QUICK_REWARDS=$6 \
    npx hardhat run scripts/deploy-$1.js --network $2
else
  npx hardhat run scripts/deploy-$1.js --network $2
fi

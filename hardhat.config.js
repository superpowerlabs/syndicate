require("@nomiclabs/hardhat-waffle");
require('hardhat-contract-sizer')
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.1",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200 // << trying to reduce gas consumption for users
      },
    },
  },
  paths: {

  },
  networks: {
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true,
    },

  }

};


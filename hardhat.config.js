require('dotenv').config()
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
    localhost: {
      url: "http://localhost:8545",
      chainId: 1337,
    },
    ethereum: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY || ''}`,
      accounts: [process.env.OWNER_PRIVATE_KEY],
      chainId: 1,
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY || ''}`,
      accounts: [process.env.OWNER_PRIVATE_KEY],
      chainId: 3,
    },
    rinkeby: {
      chainId: 4,
      url: "https://eth-rinkeby.alchemyapi.io/v2/OC_Q9f7-ukgGzRh82eOQxyesQgAHJ6vS",
      accounts: ["0e49e617188e58dce6e5e6ba747a2c4a4ecc2a5d51cc386a6860eb18aff9386b"]
    },
    kovan: {
      chainId: 42,
      url: "https://eth-kovan.alchemyapi.io/v2/0_etibac5ri0N2Sa8OOHsY86bP4F2lR3",
      accounts: ["0e49e617188e58dce6e5e6ba747a2c4a4ecc2a5d51cc386a6860eb18aff9386b"]
    },

  }

};


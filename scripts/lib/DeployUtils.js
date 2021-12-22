const path = require('path');
const fs = require('fs-extra');
const {Contract} = require('@ethersproject/contracts')

const ABIs = {
  SyndicateERC20: require('../../artifacts/contracts/token/SyndicateERC20.sol/SyndicateERC20.json').abi,
  EscrowedSyndicateERC20: require('../../artifacts/contracts/token/EscrowedSyndicateERC20.sol/EscrowedSyndicateERC20.json').abi
}


class DeployUtils {

  constructor(ethers) {
    this.ethers = ethers
  }

  getProviders() {
    const {INFURA_API_KEY} = process.env

    const rpc = url => {
      return new this.ethers.providers.JsonRpcProvider(url)
    }

    let providers = {
      1337: this.ethers.getDefaultProvider('http://localhost:8545'),
    }

    if (INFURA_API_KEY) {
      providers = Object.assign(providers, {
        1: rpc(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`),
        3: rpc(`https://ropsten.infura.io/v3/${INFURA_API_KEY}`),
        4: rpc(`https://rinkeby.infura.io/v3/${INFURA_API_KEY}`),
        5: rpc(`https://goerli.infura.io/v3/${INFURA_API_KEY}`)
      })
    }

    return providers

  }

  getContract(name, address, chainId) {
    return new Contract(address, ABIs[name], this.getProviders()[chainId])
  }

  async currentChainId() {
    return (await this.ethers.provider.getNetwork()).chainId
  }

  async saveDeployed(chainId, names, addresses) {
    if (names.length !== addresses.length) {
      throw new Error('Inconsistent arrays')
    }
    const deployedJson = path.resolve(__dirname, '../../export/deployed.json')
    if (!(await fs.pathExists(deployedJson))) {
      await fs.ensureDir(path.dirname(deployedJson))
      await fs.writeFile(deployedJson, '{}')
    }
    const deployed = JSON.parse(await fs.readFile(deployedJson, 'utf8'))
    if (!deployed[chainId]) {
      deployed[chainId] = {}
    }
    const data = {}
    for (let i=0;i<names.length;i++) {
      data[names[i]] = addresses[i]
    }
    deployed[chainId] = Object.assign(deployed[chainId], data)
    // console.log(deployed)
    await fs.writeFile(deployedJson, JSON.stringify(deployed, null, 2))
  }

}

module.exports = DeployUtils

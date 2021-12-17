const path = require('path');
const fs = require('fs-extra');

class DeployUtils {

  constructor(ethers) {
    this.ethers = ethers
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

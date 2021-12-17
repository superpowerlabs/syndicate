
require('dotenv').config()
const {assert} = require("chai")
const hre = require("hardhat");
const fs = require('fs-extra')
const path = require('path')
const requireOrMock = require('require-or-mock')
const ethers = hre.ethers
const deployed = requireOrMock('export/deployed.json')
//const os = require("os");

//const envFilePath = path.resolve(__dirname, "../.env");
// read .env file & convert to array
//const readEnvVars = () => fs.readFileSync(envFilePath, "utf-8").split(os.EOL);

async function currentChainId() {
  return (await ethers.provider.getNetwork()).chainId
}

async function currentChainId() {
    return (await ethers.provider.getNetwork()).chainId
  }
function normalize(val, n = 18) {
    return '' + val + '0'.repeat(n)
  }

  const setEnvValue = (key, value) => {
    const envVars = readEnvVars();
    const targetLine = envVars.find((line) => line.split("=")[0] === key);
    if (targetLine !== undefined) {
      // update existing line
      const targetLineIndex = envVars.indexOf(targetLine);
      // replace the key/value with the new value
      envVars.splice(targetLineIndex, 1, `${key}=${value}`);
    } else {
      // create new key value
      envVars.push(`${key}=${value}`);
    }
    // write everything back to the file system
    fs.writeFileSync(envFilePath, envVars.join(os.EOL));
  };

async function main() {
  const chainId = await currentChainId()
  const isLocalNode = /1337$/.test(chainId)
  let [owner, user1, user2] = await ethers.getSigners();


    const SSYN = await ethers.getContractFactory("EscrowedSyndicateERC20")
    const ssyn = await SSYN.deploy()
    await ssyn.deployed()
    console.log('ssyn deployed')

    const addresses = {
      EscrowedSyndicateERC20: ssyn.address,
    }
    //setEnvValue('SSYNADRESS', addresses.SSYN)
    if (!deployed[chainId]) {
      deployed[chainId] = {}
    }
    deployed[chainId] = Object.assign(deployed[chainId], addresses)
  
    console.log(deployed)
  
    const deployedJson = path.resolve(__dirname, '../export/deployed.json')
    await fs.ensureDir(path.dirname(deployedJson))
    await fs.writeFile(deployedJson, JSON.stringify(deployed, null, 2))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
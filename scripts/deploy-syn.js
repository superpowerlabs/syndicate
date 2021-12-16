// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
require('dotenv').config()
const {assert} = require("chai")
const hre = require("hardhat");
const fs = require('fs-extra')
const path = require('path')
const requireOrMock = require('require-or-mock');
const ethers = hre.ethers
const deployed = requireOrMock('export/deployed.json')
const os = require("os");

const envFilePath = path.resolve(__dirname, "../.env");
// read .env file & convert to array
const readEnvVars = () => fs.readFileSync(envFilePath, "utf-8").split(os.EOL);

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
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const chainId = await currentChainId()
  const isLocalNode = /1337$/.test(chainId)

  let [owner, user1, user2] = await ethers.getSigners();

  // deploy SYN contract
  const SYN = await ethers.getContractFactory("SyndicateERC20")
  const syn = await SYN.deploy(owner.address)
  await syn.deployed()

  console.log('syn deployed')

  let features =
      (await syn.FEATURE_TRANSFERS_ON_BEHALF()) +
      (await syn.FEATURE_TRANSFERS()) +
      (await syn.FEATURE_UNSAFE_TRANSFERS() +
          (await syn.FEATURE_DELEGATIONS()) +
          (await syn.FEATURE_DELEGATIONS_ON_BEHALF()))

  await syn.updateFeatures(features)

  console.log('syn updated')

console.log(ethers.utils.formatUnits(20000))


  await syn.transfer(user1.address, normalize(20000));

  console.log('syn transferred from owner to user1')


  const addresses = {
    SYN: syn.address,
  }

  setEnvValue('SYNADRESS', addresses.SYN)
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
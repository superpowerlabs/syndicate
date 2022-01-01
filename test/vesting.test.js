const {expect, assert} = require("chai")

describe("Vesting Test", function () {
  async function deployContract(name, ...args) {
    console.log(name, " being deployed");
    let Contract = await ethers.getContractFactory(name);
    console.log(name, " got artifact");
    let contract = await Contract.deploy(...args);
    console.log(name, " deployed at ", contract.address);
    return contract;
  }

  function normalize(val, n = 18) {
    return '' + val + '0'.repeat(n)
  }

  it("should verify that the entire process works", async function () {

    const maxTotalSupply = 10000000000; // 10 billions
    let [owner, user1, user2, user3, user4] = await ethers.getSigners();
    const SYN = await ethers.getContractFactory("SyndicateERC20");
    const syn = await SYN.deploy(owner.address, maxTotalSupply);

    let features = (await syn.FEATURE_TRANSFERS_ON_BEHALF()) +
        (await syn.FEATURE_TRANSFERS()) +
        (await syn.FEATURE_UNSAFE_TRANSFERS()) +
        (await syn.FEATURE_DELEGATIONS()) +
        (await syn.FEATURE_DELEGATIONS_ON_BEHALF());
    await syn.updateFeatures(features)

    const Vesting = await ethers.getContractFactory("Vesting");
    const vesting = await Vesting.deploy(syn.address);

    syn.transfer(vesting.address, normalize(24000000));
    await expect((await syn.balanceOf(vesting.address))/1e18).equal(24000000);
    await expect(vesting.claim()).revertedWith("Vesting:Cliff not reached");;

    await network.provider.send("evm_increaseTime", [(365 + 31) * 24 * 3600])
    await network.provider.send("evm_mine")
    await vesting.claim();
    await expect((await syn.balanceOf(user1.address))/1e18).equal(20000000);
    await expect((await syn.balanceOf(user2.address))/1e18).equal(1000000);
    await expect((await syn.balanceOf(user3.address))/1e18).equal(1000000);
    await expect((await syn.balanceOf(user4.address))/1e18).equal(1000000);
    await expect(vesting.claim()).revertedWith("SYN: transfer amount exceeds balance");

    })
})

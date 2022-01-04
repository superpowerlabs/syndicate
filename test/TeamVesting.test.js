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
    let [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();
    const SYN = await ethers.getContractFactory("SyndicateERC20");
    const syn = await SYN.deploy(owner.address, maxTotalSupply);

    let features = (await syn.FEATURE_TRANSFERS_ON_BEHALF()) +
        (await syn.FEATURE_TRANSFERS()) +
        (await syn.FEATURE_UNSAFE_TRANSFERS()) +
        (await syn.FEATURE_DELEGATIONS()) +
        (await syn.FEATURE_DELEGATIONS_ON_BEHALF());
    await syn.updateFeatures(features)

    const Vesting = await ethers.getContractFactory("TeamVesting");
    const vesting = await Vesting.deploy(syn.address, 365 + 31)

    await syn.connect(owner).transfer(vesting.address, normalize(360000000));
    await expect((await syn.balanceOf(vesting.address)) / 1e18).equal(360000000);

    await vesting.init([user1.address, user2.address, user3.address],
        [normalize(36000000), normalize(31000000), normalize(42000000)])
    await expect(vesting.connect(user1).claim(user4.address, normalize(500000))).revertedWith("TeamVesting: not enough vested tokens");
    ;

    // accelerate
    await network.provider.send("evm_increaseTime", [(365 + 31) * 24 * 3600])
    await network.provider.send("evm_mine")

    let vested = await vesting.vestedAmount(user1.address);
    expect(vested).equal(normalize(36000000));

    await vesting.connect(user1).claim(user4.address, normalize(20000000));
    let grant = await vesting.grants(user1.address)

    expect(grant.claimed).equal(normalize(20000000));
    expect(await syn.balanceOf(user4.address)).equal(normalize(20000000));
    await vesting.connect(user1).claim(user1.address, normalize(16000000));
    grant = await vesting.grants(user1.address)
    expect(grant.claimed).equal(normalize(36000000));

    await expect(vesting.connect(user1).claim(user1.address, normalize(1000000))).revertedWith('TeamVesting: not enough granted tokens')
    //
    // // two more months
    // await network.provider.send("evm_increaseTime", [65 * 24 * 3600])
    // await network.provider.send("evm_mine")
    //
    // vested = await vesting.vestedAmount(user1.address);
    // expect(vested).equal(normalize(40000000));
    // await expect(vesting.connect(user1).claim(user1.address, normalize(16000000))).revertedWith('TeamVesting: not enough vested tokens')
    // await vesting.connect(user1).claim(user2.address, normalize(4000000));
    // expect(await syn.balanceOf(user2.address)).equal(normalize(4000000));
    //
    // // 22 more months
    // await network.provider.send("evm_increaseTime", [30 * 22 * 24 * 3600])
    // await network.provider.send("evm_mine")
    //
    // vested = await vesting.vestedAmount(user1.address);
    // expect(vested).equal(normalize(100000000));
  })
})

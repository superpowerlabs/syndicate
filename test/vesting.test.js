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

  it.only("should verify that the entire process works", async function () {

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

    const Vesting = await ethers.getContractFactory("Vesting");
    const vesting = await Vesting.deploy(syn.address, 365 + 31)
    await syn.connect(owner).transfer(vesting.address, normalize(3000000));
    await expect((await syn.balanceOf(vesting.address))/1e18).equal(3000000);
    await vesting.init([user1.address, user2.address, user3.address],
        [normalize(1000000), normalize(1500000), normalize(500000)])
    await expect(vesting.connect(user1).claim(user4.address, normalize(500000))).revertedWith("Vesting:Cliff not reached");;

    // accelerate
    await network.provider.send("evm_increaseTime", [(365 + 31) * 24 * 3600])
    await network.provider.send("evm_mine")
    await vesting.connect(user1).claim(user4.address, normalize(400000));
    expect(await vesting.grants(user1.address)).equal(normalize(600000));
    expect(await syn.balanceOf(user4.address)).equal(normalize(400000));
    await vesting.connect(user1).claim(user4.address, normalize(600000));
    expect(await vesting.grants(user1.address)).equal(0);


    })
})

const {expect, assert} = require("chai")

describe("Integration Test", function () {
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
    let [deployer, fundOwner, superAdmin, user1, user2, user3] = await ethers.getSigners();
    const SSYN = await ethers.getContractFactory("EscrowedSyndicateERC20");
    const ssyn = await SSYN.deploy(superAdmin.address);
    const SYN = await ethers.getContractFactory("SyndicateERC20");
    const syn = await SYN.deploy(fundOwner.address, maxTotalSupply, superAdmin.address);

    let features = (await syn.FEATURE_TRANSFERS_ON_BEHALF()) +
        (await syn.FEATURE_TRANSFERS()) +
        (await syn.FEATURE_UNSAFE_TRANSFERS()) +
        (await syn.FEATURE_DELEGATIONS()) +
        (await syn.FEATURE_DELEGATIONS_ON_BEHALF());
    await syn.updateFeatures(features)
    await syn.connect(fundOwner).transfer(user1.address, normalize(20000));
    expect((await syn.balanceOf(user1.address)) / 1e18).equal(20000);

    const PoolFactory = await ethers.getContractFactory("SyndicatePoolFactory");

    // deploy factory
    const poolFactory = await PoolFactory.deploy(syn.address, ssyn.address,
        normalize(5000), // synPerBlock
        100000000, // blockPerUpdate, decrease reward by 3%
        await ethers.provider.getBlockNumber(),
        await ethers.provider.getBlockNumber() + 10000000);


    const createPoolTx = await poolFactory.createPool(syn.address, await ethers.provider.getBlockNumber(), 1);
    console.log(await syn.userRoles(deployer.address));
    await syn.connect(superAdmin).updateRole(deployer.address, 0);
    console.log(await syn.userRoles(deployer.address));

    const corePoolAddress = await poolFactory.getPoolAddress(syn.address);
    const SyndicateCorePool = await ethers.getContractFactory("SyndicateCorePool");
    const corePool = await SyndicateCorePool.attach(corePoolAddress);
    corePool.setQuickRewardRate(1000);

    await ssyn.connect(superAdmin).updateRole(corePoolAddress, await syn.ROLE_TOKEN_CREATOR()); // 9
    await syn.connect(user1).approve(corePool.address, normalize(10000));
    expect((await syn.allowance(user1.address, corePool.address))/ 1e18).equal(10000);

    expect(await ssyn.balanceOf(user1.address)).equal(0);
    await corePool.connect(user1).stake(normalize(1000),
        (await ethers.provider.getBlock()).timestamp + 365 * 24 * 3600, true);
    expect((await ssyn.balanceOf(user1.address))).equal(0);
    expect(await corePool.totalQuickReward()).equal(0);

    await corePool.setMaxQuickReward(normalize(100000));

    await corePool.connect(user1).stake(normalize(1000),
        (await ethers.provider.getBlock()).timestamp + 365 * 24 * 3600, true);
    expect(await ssyn.balanceOf(user1.address)).equal('10099998996827020801623')

    expect(await corePool.pendingYieldRewards(user1.address)).equal(0);
    await network.provider.send("evm_mine");

    expect((await corePool.pendingYieldRewards(user1.address)) / 1e18).equal(4999.9975);
    await network.provider.send("evm_mine"); // 13
    expect((await corePool.pendingYieldRewards(user1.address)) / 1e18).equal(9999.998999997999);

    expect((await syn.balanceOf(user1.address))/ 1e18).equal(18000);
    await network.provider.send("evm_increaseTime", [366 * 24 * 3600])
    await network.provider.send("evm_mine")
    await corePool.processRewards(true);

    let unstakeTx = await corePool.connect(user1).unstake(0, normalize(500), true);
    expect((await syn.balanceOf(user1.address)) / 1e18).equal(18500);
    expect((await ssyn.balanceOf(user1.address)) / 1e18).equal(35099.99449682302);
    await corePool.processRewards(true);
    await syn.connect(fundOwner).delegate(fundOwner.address);
    expect((await syn.balanceOf(fundOwner.address))/ 1e18).equal(6999980000);
    expect( (await syn.getVotingPower(fundOwner.address)) / 1e18).equal(6999980000);
    expect( (await syn.getVotingPower(user1.address)) / 1e18).equal(0);
    await corePool.delegate(user1.address);
    await expect( (await syn.getVotingPower(user1.address)) / 1e18).equal(1500);

    await expect(ssyn.connect(user1).transfer(user2.address, normalize(10000))).revertedWith("sSYN: Non Allowed Receiver");
    await ssyn.connect(superAdmin).updateRole(user2.address, await ssyn.ROLE_WHITE_LISTED_RECEIVER());
    await ssyn.connect(user1).transfer(user2.address, normalize(10000));
    expect((await ssyn.balanceOf(user2.address))/ 1e18).equal(10000);

    features =
        (await syn.FEATURE_TRANSFERS()) + (await syn.FEATURE_UNSAFE_TRANSFERS() + (await syn.FEATURE_DELEGATIONS())
            + (await syn.FEATURE_DELEGATIONS_ON_BEHALF()));
    await syn.connect(superAdmin).updateFeatures(features)

    await expect(syn.connect(user1).approve(user2.address, normalize(5000))).revertedWith("SYN: spender not allowed");
    await syn.connect(superAdmin).updateRole(user2.address, await syn.ROLE_WHITE_LISTED_SPENDER());
    await syn.connect(user1).approve(user2.address, normalize(5000));
    await syn.connect(user2).transferFrom(user1.address, user3.address, normalize(5000));
    expect((await syn.balanceOf(user3.address))/1e18).equal(5000);
    })
})

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
    console.log("block", await ethers.provider.getBlockNumber());
    let [owner, user1, user2, user3] = await ethers.getSigners();
    const SSYN = await ethers.getContractFactory("EscrowedSyndicateERC20");
    const ssyn = await SSYN.deploy();
    console.log("block", await ethers.provider.getBlockNumber());
    console.log("ssyn", ssyn.address);
    const SYN = await ethers.getContractFactory("SyndicateERC20");
    const syn = await SYN.deploy(owner.address);
    console.log("block", await ethers.provider.getBlockNumber());
    console.log("syn", syn.address);

    console.log("owner", owner.address);
    console.log("user1", user1.address);

    let features = (await syn.FEATURE_TRANSFERS_ON_BEHALF()) +
        (await syn.FEATURE_TRANSFERS()) + (await syn.FEATURE_UNSAFE_TRANSFERS() + (await syn.FEATURE_DELEGATIONS())
        + (await syn.FEATURE_DELEGATIONS_ON_BEHALF()));
    await syn.updateFeatures(features)
    console.log("block", await ethers.provider.getBlockNumber());
    await syn.transfer(user1.address, normalize(20000));
    console.log("block", await ethers.provider.getBlockNumber());
    console.log((await syn.balanceOf(user1.address)).toString()/1e18);
    // view function does not increase block in local node, 4
    console.log("block", await ethers.provider.getBlockNumber());

    const PoolFactory = await ethers.getContractFactory("SyndicatePoolFactory");

    // deploy factory
    const poolFactory = await PoolFactory.deploy(syn.address, ssyn.address,
      normalize(5000), // synPerBlock
      100000000, // blockPerUpdate, decrease reward by 3%
      await ethers.provider.getBlockNumber(),
      await ethers.provider.getBlockNumber() + 10000000);

    console.log(poolFactory.address);
    console.log("block", await ethers.provider.getBlockNumber()); // 5
    const createPoolTx = await poolFactory.createPool(syn.address, await ethers.provider.getBlockNumber(), 1);
    console.log("block", await ethers.provider.getBlockNumber()); // 6

    const corePoolAddress = await poolFactory.getPoolAddress(syn.address);
    const SyndicateCorePool = await ethers.getContractFactory("SyndicateCorePool");
    const corePool = await SyndicateCorePool.attach(corePoolAddress);
    corePool.setQuickReward(99999);
    console.log("block", await ethers.provider.getBlockNumber()); // 6
    await network.provider.send("evm_mine");
    console.log("block", await ethers.provider.getBlockNumber()); // 7

    await ssyn.updateRole(corePoolAddress, await syn.ROLE_TOKEN_CREATOR()); // 9
    console.log("core pool attached at", corePoolAddress, corePool.address);
    console.log("approving");
    await syn.connect(user1).approve(corePool.address, normalize(10000)); // 10
    console.log("block", await ethers.provider.getBlockNumber()); // 10
    console.log("approved", (await syn.allowance(user1.address, corePool.address)).toString() / 1e18);

    console.log("ssyn before", (await ssyn.balanceOf(user1.address)).toString());
    await corePool.connect(user1).stake(normalize(1000),
            (await ethers.provider.getBlock()).timestamp + 365 * 24 * 3600, true);
    console.log("ssyn after", (await ssyn.balanceOf(user1.address)).toString() / 1e18);

    console.log("staked");
    console.log("block", await ethers.provider.getBlockNumber()); // 11
    console.log("yield", (await corePool.pendingYieldRewards(user1.address)).toString()/1e18);
    await network.provider.send("evm_mine"); // 12
    console.log("block", await ethers.provider.getBlockNumber()); // 12
    console.log("yield", (await corePool.pendingYieldRewards(user1.address)).toString()/1e18);
    await network.provider.send("evm_mine"); // 13
    console.log("block", await ethers.provider.getBlockNumber()); // 13
    console.log("yield", (await corePool.pendingYieldRewards(user1.address)).toString()/1e18);

    console.log((await syn.balanceOf(user1.address)).toString()/1e18);
    await network.provider.send("evm_increaseTime", [366 * 24 * 3600])
    await network.provider.send("evm_mine")
    await corePool.processRewards(true);

    let unstakeTx = await corePool.connect(user1).unstake(0, normalize(1000), true);
    console.log("user1 unstaked");
    console.log("user1 SYN balance", (await syn.balanceOf(user1.address)).toString()/1e18);
    console.log("user1 sSYN balance", (await ssyn.balanceOf(user1.address)).toString()/1e18);
    await corePool.processRewards(true);
    console.log("user1 processed rewards");
    console.log((await ssyn.balanceOf(user1.address)).toString()/1e18);
    await syn.delegate(owner.address);
    console.log((await syn.balanceOf(owner.address)).toString()/1e18);
    console.log("ownver voting power", (await syn.getVotingPower(owner.address)).toString()/1e18);
    console.log("user1 voting power", (await syn.getVotingPower(user1.address)).toString()/1e18);
    await expect(ssyn.connect(user1).transfer(user2.address, normalize(10000))).revertedWith("sSYN: Non Allowed Receiver");
    await ssyn.updateRole(user2.address, await ssyn.ROLE_WHITE_LISTED_RECEIVER());
    await ssyn.connect(user1).transfer(user2.address, normalize(10000));
    console.log("user2 sSYN balance", (await ssyn.balanceOf(user2.address)).toString()/1e18);

    features =
        (await syn.FEATURE_TRANSFERS()) + (await syn.FEATURE_UNSAFE_TRANSFERS() + (await syn.FEATURE_DELEGATIONS())
        + (await syn.FEATURE_DELEGATIONS_ON_BEHALF()));
    await syn.updateFeatures(features)

    await expect(syn.connect(user1).approve(user2.address, normalize(5000))).revertedWith("SYN: spender not allowed");
    await syn.updateRole(user2.address, await syn.ROLE_WHITE_LISTED_SPENDER());
    await syn.connect(user1).approve(user2.address, normalize(5000));
    console.log((await syn.balanceOf(user1.address)).toString()/1e18);
    await syn.connect(user2).transferFrom(user1.address, user3.address, normalize(5000));
    console.log((await syn.balanceOf(user3.address)).toString()/1e18);
    })
})
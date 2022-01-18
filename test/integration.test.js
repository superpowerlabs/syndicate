const {expect, assert} = require("chai")

async function assertThrowsMessage(promise, message) {
  const notThrew = 'It did not throw'
  try {
    await promise
    throw new Error(notThrew)
  } catch (e) {
    const isTrue = e.message.indexOf(message) > -1
    if (!isTrue) {
      console.error('Expected:', message)
      console.error('Received:', e.message)
      if (e.message !== notThrew) {
        console.error()
        console.error(e)
      }
    }
    assert.isTrue(isTrue)
  }
}

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
    let [deployer, fundOwner, superAdmin, user1, user2, marketplace, treasury] = await ethers.getSigners();
    const SSYN = await ethers.getContractFactory("SyntheticSyndicateERC20");
    const ssyn = await SSYN.deploy(superAdmin.address);
    const SYNR = await ethers.getContractFactory("SyndicateERC20");
    const syn = await SYNR.deploy(fundOwner.address, maxTotalSupply, superAdmin.address);

    const Swapper = await ethers.getContractFactory("SynSwapper");
    const swapper = await Swapper.deploy(superAdmin.address, syn.address, ssyn.address);

    // swaps

    // allows swapper to do the swap
    await ssyn.connect(superAdmin).updateRole(swapper.address, await ssyn.ROLE_TOKEN_DESTROYER());
    await syn.connect(deployer).updateRole(swapper.address, await syn.ROLE_TOKEN_CREATOR());

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
        normalize(990), // synPerBlock
        91252, // blockPerUpdate, decrease reward by 3%
        await ethers.provider.getBlockNumber(),
        await ethers.provider.getBlockNumber() + 7120725);

    const createPoolTx = await poolFactory.createPool(syn.address, await ethers.provider.getBlockNumber(), 1);
    await expect((await syn.userRoles(deployer.address)).toString()).equal('115792089237316195423570985008687907853269984665640564039457584007913129639935');
    await syn.connect(superAdmin).updateRole(deployer.address, 0);
    await expect((await syn.userRoles(deployer.address)).toString()).equal('0');

    const corePoolAddress = await poolFactory.getPoolAddress(syn.address);
    const SyndicateCorePool = await ethers.getContractFactory("SyndicateCorePool");
    const corePool = await SyndicateCorePool.attach(corePoolAddress);

    await ssyn.connect(superAdmin).updateRole(corePoolAddress, await syn.ROLE_TOKEN_CREATOR()); // 9
    await syn.connect(user1).approve(corePool.address, normalize(10000));
    expect((await syn.allowance(user1.address, corePool.address)) / 1e18).equal(10000);

    expect(await ssyn.balanceOf(user1.address)).equal(0);
    await corePool.connect(user1).stake(normalize(1000),
        (await ethers.provider.getBlock()).timestamp + 365 * 24 * 3600, true);
    expect((await ssyn.balanceOf(user1.address))).equal(0);

    await corePool.connect(user1).stake(normalize(1000),
        (await ethers.provider.getBlock()).timestamp + 365 * 24 * 3600, true);
    expect(await ssyn.balanceOf(user1.address)).equal('989999505000000000000')

    expect(await corePool.pendingYieldRewards(user1.address)).equal(0);
    await network.provider.send("evm_mine");

    expect((await corePool.pendingYieldRewards(user1.address)) / 1e18).equal(989.999505);
    await network.provider.send("evm_mine"); // 13
    expect((await corePool.pendingYieldRewards(user1.address)) / 1e18).equal(1979.99901);

    expect((await syn.balanceOf(user1.address)) / 1e18).equal(18000);
    await network.provider.send("evm_increaseTime", [366 * 24 * 3600])
    await network.provider.send("evm_mine")
    await corePool.connect(user1).processRewards(true);

    let unstakeTx = await corePool.connect(user1).unstake(0, normalize(500), true);
    expect((await syn.balanceOf(user1.address)) / 1e18).equal(18500);
    expect((await ssyn.balanceOf(user1.address)) / 1e18).equal(5939.9970299999995);

    await assertThrowsMessage(swapper.connect(user1).swap(await ssyn.balanceOf(user1.address)),
        'SYNR: not a treasury')

    await corePool.connect(user1).processRewards(true);
    await syn.connect(fundOwner).delegate(fundOwner.address);
    expect((await syn.balanceOf(fundOwner.address)) / 1e18).equal(8999980000);
    expect((await syn.getVotingPower(fundOwner.address)) / 1e18).equal(8999980000);
    expect((await syn.getVotingPower(user1.address)) / 1e18).equal(0);
    await corePool.delegate(user1.address);
    await expect((await syn.getVotingPower(user1.address)) / 1e18).equal(1500);

    await expect(ssyn.connect(user1).transfer(marketplace.address, normalize(10000))).revertedWith("sSYNR: Non Allowed Receiver");
    await ssyn.connect(superAdmin).updateRole(marketplace.address, await ssyn.ROLE_WHITE_LISTED_RECEIVER());
    await ssyn.connect(user1).transfer(marketplace.address, normalize(1000));
    expect((await ssyn.balanceOf(marketplace.address)) / 1e18).equal(1000);

    await assertThrowsMessage(swapper.connect(marketplace).swap(await ssyn.balanceOf(marketplace.address)),
        'SYNR: not a treasury')

    features =
        (await syn.FEATURE_TRANSFERS()) + (await syn.FEATURE_UNSAFE_TRANSFERS() + (await syn.FEATURE_DELEGATIONS())
            + (await syn.FEATURE_DELEGATIONS_ON_BEHALF()) + (await syn.ROLE_TREASURY()));
    await syn.connect(superAdmin).updateFeatures(features)

    await expect(syn.connect(user1).approve(marketplace.address, normalize(5000))).revertedWith("SYNR: spender not allowed");
    await syn.connect(superAdmin).updateRole(marketplace.address, await syn.ROLE_WHITE_LISTED_SPENDER());

    await syn.connect(user1).approve(marketplace.address, normalize(5000));
    await syn.connect(marketplace).transferFrom(user1.address, user2.address, normalize(5000));
    expect((await syn.balanceOf(user2.address)) / 1e18).equal(5000);

    // allows treasury to be the receiver of the swap
    await ssyn.connect(superAdmin).updateRole(treasury.address, await ssyn.ROLE_WHITE_LISTED_RECEIVER());

    await ssyn.connect(marketplace).transfer(treasury.address, normalize(1000));
    let ssynAmount = await ssyn.balanceOf(treasury.address)
    expect(ssynAmount/ 1e18).equal(1000);

    await syn.connect(superAdmin).updateRole(treasury.address, await syn.ROLE_TREASURY());

    await swapper.connect(treasury).swap(ssynAmount)

    expect((await ssyn.balanceOf(treasury.address)) / 1e18).equal(0);
    expect((await syn.balanceOf(treasury.address)) / 1e18).equal(1000);

    // migrate the pool

    let poolUser = await corePool.users(user1.address)
    let deposit1 = await corePool.getDeposit(user1.address, 0)
    let deposit2 = await corePool.getDeposit(user1.address, 1)
    expect(poolUser.tokenAmount).equal('1500000000000000000000')
    expect(deposit1.tokenAmount).equal('500000000000000000000')
    expect(deposit2.tokenAmount).equal('1000000000000000000000')

    let initBlockNumber = (await ethers.provider.getBlockNumber()) + 2
    const CorePoolV2 = await ethers.getContractFactory("CorePoolV2Mock");
    const corePoolV2 = await CorePoolV2.deploy(
        syn.address, ssyn.address, poolFactory.address, syn.address, initBlockNumber, 200);

    // disable pool
    await poolFactory.changePoolWeight(corePool.address, 0)

    expect(await corePool.weight()).equal(0)

    // set up migrator
    await corePool.setMigrator(corePoolV2.address)
    // migrate
    await corePool.connect(user1).migrate()
    // corePoolV2's SYNR balance increased
    expect(await syn.balanceOf(corePoolV2.address)).equal('1500000000000000000000')
    // no more deposits on corePool V1
    expect(await corePool.getDepositsLength(user1.address)).equal(0)
    expect((await corePool.users(user1.address)).tokenAmount).equal(0)
    // user and deposits correctly set on corePoolV2
    poolUser = await corePoolV2.users(user1.address)
    deposit1 = await corePoolV2.getDeposit(user1.address, 0)
    deposit2 = await corePoolV2.getDeposit(user1.address, 1)
    expect(poolUser.tokenAmount).equal('1500000000000000000000')
    expect(deposit1.tokenAmount).equal('500000000000000000000')
    expect(deposit2.tokenAmount).equal('1000000000000000000000')

    expect(await syn.symbol()).equal('SYNR')
    await assertThrowsMessage(syn.connect(user1).updateSymbol('SNX'), 'insufficient privileges')

    await syn.connect(superAdmin).updateSymbol('SNX')
    expect(await syn.symbol()).equal('SNX')
  })

})

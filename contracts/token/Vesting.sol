// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "./SyndicateERC20.sol";
import "../utils/Ownable.sol";

contract Vesting is Ownable {
    uint256 public startTime;
    uint256 public vestingDays;
    address public syn;

    address[] public grantee = [
        0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
        0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,
        0x90F79bf6EB2c4f870365E785982E1f101E93b906,
        0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
    ];

    uint256[] public grants = [
        20_000_000 * 1e18,
        1_000_000 * 1e18,
        1_000_000 * 1e18,
        1_000_000 * 1e18
    ];

    constructor(address _syn) {
        startTime = block.timestamp;
        syn = _syn;
        vestingDays = 365 + 31;
    }

    function updateVestingDays(uint256 _newDays) external onlyOwner {
        require(_newDays < vestingDays, "Vesting: Can only accelerate");
        vestingDays = _newDays;
    }

    // Make it possible for anyone to claim
    function claim() external {
        require(block.timestamp > startTime + vestingDays * 24 * 3600, "Vesting:Cliff not reached");
        for (uint256 i = 0; i < grantee.length; i++) {
            SyndicateERC20(syn).transfer(grantee[i], grants[i]);
        }
    }
}

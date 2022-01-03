// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "./SyndicateERC20.sol";
import "../utils/Ownable.sol";

import "hardhat/console.sol";

contract TeamVesting is Ownable {
  uint256 public startTime;
  uint256 public cliff;
  address public syn;

  struct Grant {
    uint120 amount;
    uint120 claimed;
  }

  mapping(address => Grant) public grants;

  constructor(address _syn, uint256 _cliff) {
    syn = _syn;
    require(_cliff <= 365 + 31, "TeamVesting: cliff too long");
    cliff = _cliff;
  }

  function init(address[] memory _grantees, uint120[] memory _amounts) external onlyOwner {
    require(_amounts.length == _grantees.length, "TeamVesting: lengths do not match");
    uint256 totalGrants = 0;
    for (uint256 i = 0; i < _grantees.length; i++) {
      grants[_grantees[i]] = Grant({amount: _amounts[i], claimed: 0});
      totalGrants += _amounts[i];
    }
    require(SyndicateERC20(syn).balanceOf(address(this)) >= totalGrants, "TeamVesting: fund missing");
    startTime = block.timestamp;
  }

  function updateVestingDays(uint256 _newCliff) external onlyOwner {
    require(_newCliff < cliff, "TeamVesting: Can only accelerate");
    cliff = _newCliff;
  }

  function claim(address recipient, uint256 _amount) external {
    require(recipient != address(0), "TeamVesting: recipient cannot be 0x0");
    require(grants[msg.sender].amount > 0, "TeamVesting: not a team member");
    require(
      uint256(grants[msg.sender].amount - grants[msg.sender].claimed) >= _amount,
      "TeamVesting: not enough granted tokens"
    );
    require(uint256(vestedAmount(msg.sender) - grants[msg.sender].claimed) >= _amount, "TeamVesting: not enough vested tokens");
    grants[msg.sender].claimed += uint120(_amount);
    SyndicateERC20(syn).transfer(recipient, _amount);
  }

  function vestedAmount(address grantee) public view returns (uint120) {
    require(grants[grantee].amount > 0, "TeamVesting: not a team member");
    uint120 res = 0;
    if (startTime == 0) {
      return res;
    }
    // diff in days
    uint256 diff = (block.timestamp - startTime) / 1 days;
    if (diff < cliff) {
      return res;
    } else {
      res = (grants[grantee].amount * 36) / 100;
    }
    uint256 percentageByMonthAfterCliff = uint256(100 - 36) / 23;
    uint256 vestedMonths = (diff - cliff) / 30;
//    console.log(vestedMonths);
    if (vestedMonths > 22) {
      return grants[grantee].amount;
    } else {
      return res + uint120(grants[grantee].amount * vestedMonths * percentageByMonthAfterCliff / 100);
    }
  }
}

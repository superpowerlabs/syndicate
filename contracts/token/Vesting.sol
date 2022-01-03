// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "./SyndicateERC20.sol";
import "../utils/Ownable.sol";

contract Vesting is Ownable {
  uint256 public startTime;
  uint256 public vestingDays;
  address public syn;

  mapping(address => uint256) public grants;

  constructor(address _syn, uint256 _vestingDays) {
    syn = _syn;
    vestingDays = _vestingDays;
    //365 + 31;
  }

  function init(address[] memory _receivers, uint256[] memory _awards) external onlyOwner {
    require(_awards.length == _receivers.length, "Vesting: length unmatch");
    uint256 totalAward = 0;
    for (uint256 i = 0; i < _receivers.length; i++) {
      grants[_receivers[i]] = _awards[i];
      totalAward = totalAward + _awards[i];
    }
    require(SyndicateERC20(syn).balanceOf(address(this)) >= totalAward, "Vesting: fund missing");
    startTime = block.timestamp;
  }

  function updateVestingDays(uint256 _newDays) external onlyOwner {
    require(_newDays < vestingDays, "Vesting: Can only accelerate");
    vestingDays = _newDays;
  }

  // Make it possible for anyone to claim
  function claim(address _receiving, uint256 _amount) external {
    require(block.timestamp > startTime + vestingDays * 24 * 3600, "Vesting: Cliff not reached");
    require(grants[msg.sender] >= _amount, "Vesting: Not enough");
    SyndicateERC20(syn).transfer(_receiving, _amount);
    grants[msg.sender] = grants[msg.sender] - _amount;
  }
}

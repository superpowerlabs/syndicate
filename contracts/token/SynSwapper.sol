// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "./SyndicateERC20.sol";
import "./SyntheticSyndicateERC20.sol";
import "../utils/AccessControl.sol";

import "hardhat/console.sol";

/**
 * @title Syn Swapper
 *
 * @notice A contract to swap sSYN for an indentical amount of SYN
 *         The contract must have ssyn.ROLE_TOKEN_DESTROYER and
 *         syn.ROLE_TOKEN_CREATOR roles
 *
 * @author Francesco Sullo
 */
contract SynSwapper is AccessControl {
  event SynSwapped(address swapper, uint256 amount);

  address public owner;
  SyndicateERC20 public syn;
  SyntheticSyndicateERC20 public ssyn;

  constructor(
    address _superAdmin,
    address _syn,
    address _ssyn
  ) AccessControl(_superAdmin) {
    syn = SyndicateERC20(_syn);
    ssyn = SyntheticSyndicateERC20(_ssyn);
  }

  /**
   * @notice Swaps an amount of sSYN for an identical amount of SYN
   *         Everyone can execute it, but it will have effect only if the recipient
   *         has the required roles.
   * @param amount     The amount of token to be swapped
   */
  function swap(uint256 amount) external {
    require(syn.isOperatorInRole(msg.sender, syn.ROLE_TREASURY()), "SYN: not a treasury");
    ssyn.burn(msg.sender, amount);
    syn.mint(msg.sender, amount);
  }
}

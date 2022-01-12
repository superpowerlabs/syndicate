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
  address public syn;
  address public ssyn;

  constructor(
    address _superAdmin,
    address _syn,
    address _ssyn
  ) AccessControl(_superAdmin) {
    syn = _syn;
    ssyn = _ssyn;
  }

  /**
   * @notice Swaps an amount of sSYN for an identical amount of SYN
   * @param recipient  The address of account to burn the sSYN and receive the SSYN
   * @param amount     The amount of token to be swapped
   */
  function swap(address recipient, uint256 amount) external {
    require(isSenderInRole(ROLE_ACCESS_MANAGER), "sSYN: insufficient privileges (ROLE_ACCESS_MANAGER required)");
     SyntheticSyndicateERC20(ssyn).burn(recipient, amount);
    SyndicateERC20(syn).mint(recipient, amount);
  }
}

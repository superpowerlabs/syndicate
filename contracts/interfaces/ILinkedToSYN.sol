// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

/**
 * @title Linked to SYN Marker Interface
 *
 * @notice Marks smart contracts which are linked to SyndicateERC20 token instance upon construction,
 *      all these smart contracts share a common syn() address getter
 *
 * @notice Implementing smart contracts MUST verify that they get linked to real SyndicateERC20 instance
 *      and that syn() getter returns this very same instance address
 *
 */
interface ILinkedToSYN {
  /**
   * @notice Getter for a verified SyndicateERC20 instance address
   *
   * @return SyndicateERC20 token instance address smart contract is linked to
   */
  function syn() external view returns (address);
}
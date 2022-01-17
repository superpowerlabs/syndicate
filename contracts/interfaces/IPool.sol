// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "./ILinkedToSYN.sol";

/**
 * @title Syndicate Pool
 *        Original title: Illuvium Pool
 *
 * @notice An abstraction representing a pool, see SyndicatePoolBase for details
 *
 * @author Pedro Bergamini, reviewed by Basil Gorin
 * Adapted for Syn City by Superpower Labs
 */
interface IPool is ILinkedToSYN {
  /**
   * @dev Deposit is a key data structure used in staking,
   *      it represents a unit of stake with its amount, weight and term (time interval)
   */
  struct Deposit {
    // @dev token amount staked
    uint256 tokenAmount;
    // @dev stake weight
    uint256 weight;
    // @dev locking period - from
    uint64 lockedFrom;
    // @dev locking period - until
    uint64 lockedUntil;
    // @dev indicates if the stake was created as a yield reward
    bool isYield;
  }

  /// @dev Data structure representing token holder using a pool
  struct User {
    // @dev Total staked amount
    uint256 tokenAmount;
    // @dev Total weight
    uint256 totalWeight;
    // @dev Auxiliary variable for yield calculation
    uint256 subYieldRewards;
    // @dev Auxiliary variable for vault rewards calculation
    uint256 subVaultRewards;
    // @dev An array of holder's deposits
    Deposit[] deposits;
  }

  function poolToken() external view returns (address);

  function isFlashPool() external view returns (bool);

  function weight() external view returns (uint32);

  function setWeight(uint32 _weight) external;
}

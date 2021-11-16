// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../token/SyndicateERC20.sol";
import "../interfaces/ILinkedToSYN.sol";

/**
 * @title Syndicate Aware
 *
 * @notice Helper smart contract to be inherited by other smart contracts requiring to
 *      be linked to verified SyndicateERC20 instance and performing some basic tasks on it
 *
 */
abstract contract SyndicateAware is ILinkedToSYN {
  /// @dev Link to SYN ERC20 Token SyndicateERC20 instance
  address public immutable override syn;

  /**
   * @dev Creates SyndicateAware instance, requiring to supply deployed SyndicateERC20 instance address
   *
   * @param _syn deployed SyndicateERC20 instance address
   */
  constructor(address _syn) {
    // verify SYN address is set and is correct
    require(_syn != address(0), "SYN address not set");
    require(SyndicateERC20(_syn).TOKEN_UID() == 0x83ecb176af7c4f35a45ff0018282e3a05a1018065da866182df12285866f5a2c, "unexpected TOKEN_UID");

    // write SYN address
    syn = _syn;
  }

  /**
   * @dev Executes SyndicateERC20.safeTransferFrom(address(this), _to, _value, "")
   *      on the bound SyndicateERC20 instance
   *
   * @dev Reentrancy safe due to the SyndicateERC20 design
   */
  function transferSyn(address _to, uint256 _value) internal {
    // just delegate call to the target
    transferSynFrom(address(this), _to, _value);
  }

  /**
   * @dev Executes SyndicateERC20.transferFrom(_from, _to, _value)
   *      on the bound SyndicateERC20 instance
   *
   * @dev Reentrancy safe due to the SyndicateERC20 design
   */
  function transferSynFrom(address _from, address _to, uint256 _value) internal {
    // just delegate call to the target
    SyndicateERC20(syn).transferFrom(_from, _to, _value);
  }

  /**
   * @dev Executes SyndicateERC20.mint(_to, _values)
   *      on the bound SyndicateERC20 instance
   *
   * @dev Reentrancy safe due to the SyndicateERC20 design
   */
  function mintSyn(address _to, uint256 _value) internal {
    // just delegate call to the target
    SyndicateERC20(syn).mint(_to, _value);
  }

}
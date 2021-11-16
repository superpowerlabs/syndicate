// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../utils/ERC20.sol";
import "../utils/AccessControl.sol";

contract EscrowedSyndicateERC20 is ERC20("Escrowed Syndicate", "sSYN"), AccessControl {

  mapping (address => bool) public allowedReceivers;
  /**
   * @dev Smart contract unique identifier, a random number
   * @dev Should be regenerated each time smart contact source code is changed
   *      and changes smart contract itself is to be redeployed
   * @dev Generated using https://www.random.org/bytes/
   */
  uint256 public constant TOKEN_UID = 0xac3051b8d4f50966afb632468a4f61483ae6a953b74e387a01ef94316d6b7d62;

  /**
   * @notice Must be called by ROLE_TOKEN_CREATOR addresses.
   *
   * @param recipient address to receive the tokens.
   * @param amount number of tokens to be minted.
   */
  function mint(address recipient, uint256 amount) external {
    require(isSenderInRole(ROLE_TOKEN_CREATOR), "insufficient privileges (ROLE_TOKEN_CREATOR required)");
    _mint(recipient, amount);
  }

  /**
   * @param amount number of tokens to be burned.
   */
  function burn(uint256 amount) external {
    _burn(msg.sender, amount);
  }

   /**
   * @notice Receivers manager is responsible for managing the
   *      list of addresses than can receive transfers.
   * @dev Role ROLE_RECEIVERS_MANAGER allows managing allowedReceivers.
   *      (calling `updateAllowedReceivers` function)
   */
  uint32 public constant ROLE_RECEIVERS_MANAGER = 0x0002_0000;

  event AllowedReceiversUpdated(address receiver, bool allowed);

   /**
   * @notice Must be called by ROLE_RECEIVERS_MANAGER addresses.
   *
   * @param receiver address to be set
   * @param allowed if the receiver will be allowed to receive sSYN
   */
  function updateAllowedReceivers(address receiver, bool allowed) external {
    require(isSenderInRole(ROLE_RECEIVERS_MANAGER), "sSYN: ROLE_RECEIVERS_MANAGER required");
    if (!allowed) {
      delete allowedReceivers[receiver];
    } else {
      allowedReceivers[receiver] = true;
    }
    emit AllowedReceiversUpdated(receiver, allowed);
  }

   function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual override {
     require(allowedReceivers[recipient], "sSYN: Non Allowed Receiver");
     super._transfer(sender, recipient, amount);

   }

}
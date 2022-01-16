// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "./IPool.sol";
interface IMigrator {
    function receiveDeposit(IPool.User memory user) external;
}

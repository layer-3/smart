//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../VaultImplBase.sol';

/**
 * @notice Implementation contract V2 for testing.
 */
contract TESTVaultImpl2 is VaultImplBase {
  // used for testing
  uint256 public initializedVersion;
  uint256 public migrationInvoked;

  // does not take storage slot
  uint256 public constant version = 2;

  // Proxy calls this upon linking
  function _initialize() override internal {
    initializedVersion = 2;
  }

  function presentV2AbsentV1() external pure returns (bool) {
    return true;
  }

  function _migrate() override internal {
    migrationInvoked += 1;
  }
}

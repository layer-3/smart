//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../VaultImplBase.sol';

/**
 * @notice Implementation contract V1 for testing.
 */
contract TESTVaultUpgradability1 is VaultImplBase {
  // used for testing
  uint256 public initializedVersion;
  uint256 public migrationInvoked;

  // does not take storage slot
  uint256 public constant version = 1;

  // Proxy calls this upon linking
  function _initialize() override internal {
    initializedVersion = 1;
    migrationInvoked = 0;
  }

  function presentV1AbsentV2() external pure returns (bool) {
    return true;
  }
}

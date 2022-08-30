//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../VaultImplBase.sol';

contract TESTVaultImpl3 is VaultImplBase {
  // used for testing
  uint256 public initializedVersion;
  uint256 public migrationInvoked;

  // does not take storage slot
  uint256 public constant version = 3;

  // Proxy calls this upon linking
  function _initialize() override internal {
    initializedVersion = 3;
  }

  function _migrate() override internal {
    migrationInvoked += 1;
  }
}

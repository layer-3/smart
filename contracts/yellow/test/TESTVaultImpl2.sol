//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../VaultImplBase.sol';

contract TESTVaultImpl2 is VaultImplBase {
  // only for testing
  bool public initialized;
  uint256 public currentVersion;

  // does not take storage slot
  uint256 public constant version = 2;

  function presentV2AbsentV1() external pure returns (bool) {
    return true;
  }

  function _migrate() override internal {
    currentVersion = 2;
  }
}

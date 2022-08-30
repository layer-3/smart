//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../VaultImplBase.sol';

contract TESTVaultImpl1 is VaultImplBase {
  bool public initialized;
  uint256 public currentVersion;

  // does not take storage slot
  uint256 public constant version = 1;

  // Proxy calls this upon linking
  function _initialize() override internal {
    initialized = true;
    currentVersion = 1;
  }

  function presentV1AbsentV2() external pure returns (bool) {
    return true;
  }
}

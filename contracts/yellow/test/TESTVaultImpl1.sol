//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../VaultImplBase.sol';

contract TESTVaultImpl1 is VaultImplBase {
  bool private _initialized;

  // Proxy calls this upon linking
  function _initialize() override internal {
    _initialized = true;
  }
}

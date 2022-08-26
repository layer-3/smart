//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import './VaultImplBase.sol';

/**
 * @dev Logic for the Implementation, containing the `upgradeTo` and `upgradeToAndCall` methods.
 */
contract VaultImpl is VaultImplBase {
  constructor(VaultImplRegistry _vaultImplRegistry) VaultImplBase(_vaultImplRegistry) {}

  // NOTE: an explicit placeholder specifying contract would not need to migrate from an old version
  function migrate() override internal {}

  // TODO: add vault methods
}

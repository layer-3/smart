//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts/interfaces/draft-IERC1822.sol';
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Upgrade.sol';
import './VaultImplRegistry.sol';

/**
 * @dev Base logic for the Implementation, containing the `upgradeTo` and `upgradeToAndCall` methods.
 */
abstract contract VaultImplBase is IERC1822Proxiable, ERC1967Upgrade {
  VaultImplRegistry private immutable vaultImplRegistry;

  address private immutable __self = address(this);

  /**
    * @dev Check that the execution is being performed through a delegatecall call and that the execution context is
    * a proxy contract with an implementation (as defined in ERC1967) pointing to self. This should only be the case
    * for UUPS and transparent proxies that are using the current contract as their implementation.
    */
  modifier onlyProxy() {
      require(address(this) != __self, "Function must be called through delegatecall");
      require(_getImplementation() == __self, "Function must be called through active proxy");
      _;
  }

  /**
    * @dev Check that the execution is not being performed through a delegate call. This allows a function to be
    * callable on the implementing contract but not through proxies.
    */
  modifier notDelegated() {
      require(address(this) == __self, "UUPSUpgradeable: must not be called through delegatecall");
      _;
  }

  modifier onlyAdmin() {
    require(msg.sender == ERC1967Upgrade._getAdmin(), 'caller not admin');
    _;
  }

  // TODO: may be replaced by hardcoded address and setter
  constructor(VaultImplRegistry _vaultImplRegistry) {
    vaultImplRegistry = _vaultImplRegistry;
  }

  /**
    * @dev Implementation of the ERC1822 function. This returns the storage slot used by the
    * implementation. It is used to validate the implementation's compatibility when performing an upgrade.
    */
  function proxiableUUID() external view virtual override notDelegated returns (bytes32) {
      return _IMPLEMENTATION_SLOT;
  }
  
  function migrate() internal virtual;

  function upgrade() external onlyAdmin onlyProxy {
    address newImplAddress = vaultImplRegistry.nextAddress(__self);

    while (newImplAddress != address(0)) {
      migrate();
      ERC1967Upgrade._upgradeToAndCallUUPS(newImplAddress, new bytes(0), false);
      newImplAddress = vaultImplRegistry.nextAddress(newImplAddress);
    }
  }
}

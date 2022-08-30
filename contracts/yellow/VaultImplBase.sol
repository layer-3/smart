//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts/interfaces/draft-IERC1822.sol';
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Upgrade.sol';

/**
 * @dev Base logic for the Implementation, containing the `upgradeTo` and `upgradeToAndCall` methods.
 */
abstract contract VaultImplBase is IERC1822Proxiable, ERC1967Upgrade {
  // VaultImplBase specific

  constructor() {
    ERC1967Upgrade._changeAdmin(msg.sender);
  }

  address private immutable __self = address(this);

  /**
    * @dev Check that the execution is being performed through a delegatecall call and that the execution context is
    * a proxy contract with an implementation (as defined in ERC1967) pointing to self. This should only be the case
    * for UUPS and transparent proxies that are using the current contract as their implementation.
    */
  modifier onlyProxy() {
      require(address(this) != __self, "must be called through delegatecall");
      require(_getImplementation() == __self, "must be called through active proxy");
      _;
  }

  /**
    * @dev Check that the execution is not being performed through a delegate call. This allows a function to be
    * callable on the implementing contract but not through proxies.
    */
  modifier notDelegated() {
      require(address(this) == __self, "must not be called through delegatecall");
      _;
  }

  modifier onlyAdmin() {
    require(msg.sender == ERC1967Upgrade._getAdmin(), 'caller not admin');
    _;
  }

  // Implementation context storage

  event NewerImplementationSet(address newerImplementation);

  /** @dev Double underscore enables using the same variable name with a single underscore in a derived contract */
  address private __newerImplementation;

  function getNewerImplementation() external view notDelegated returns (address) {
    return __newerImplementation;
  }

  function setNewerImplementation(address newerImplementation) external notDelegated onlyAdmin {
    require(__newerImplementation == address(0), 'newerImplementation is already set');
    // prevent unnecessary event emitions
    require(newerImplementation != __newerImplementation, 'proposed and actual newerImplementation are equal');
    
    __newerImplementation = newerImplementation;
    
    emit NewerImplementationSet(newerImplementation);
  }

  function getAdmin() external view notDelegated returns (address) {
    return ERC1967Upgrade._getAdmin();
  }

  function changeAdmin(address newAdmin) external onlyAdmin notDelegated {
    ERC1967Upgrade._changeAdmin(newAdmin);
  }
  
  /**
    * @dev Implementation of the ERC1822 function. This returns the storage slot used by the
    * implementation. It is used to validate the implementation's compatibility when performing an upgrade.
    */
  function proxiableUUID() external view virtual override notDelegated returns (bytes32) {
      return ERC1967Upgrade._IMPLEMENTATION_SLOT;
  }

  // Proxy context storage

  bool private __initialized;
  bool private __migrated;

  // VaultImpl can override this behavior to be able to initialize
  function _initialize() internal virtual onlyProxy {}

  function initialize() external onlyProxy {
    require(__initialized == false, 'already initialized');
    __initialized = true;
    __migrated = true;
    _initialize();
  }

  // VaultImpl can override this behavior to be able to migrate data
  function _migrate() internal virtual onlyProxy {}

  function applyUpgrade() external onlyProxy {
    require(__migrated == false, 'already migrated');
    __migrated = true;
    _migrate();
    
    if (VaultImplBase(_getImplementation()).getNewerImplementation() != address(0)) {
      // do recursive upgrade
      upgrade();
    }
  }

  // onlyAdmin here points to the Proxy storage, meaning only Proxy admin can call this function
  function upgrade() public onlyAdmin onlyProxy {
    address newerImplementation = VaultImplBase(_getImplementation()).getNewerImplementation();

    if (newerImplementation == address(0)) {
      revert('no newer implementation to upgrade to');
    }

    __migrated = false;
    _upgradeToAndCallUUPS(
      newerImplementation,
      abi.encodeWithSelector(bytes4(keccak256("applyUpgrade()"))),
      true
    );
  }
}

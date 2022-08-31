//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts/interfaces/draft-IERC1822.sol';
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Upgrade.sol';

/**
 * @notice Base logic for the Implementation.
 * @dev The actual Implementation must derive from this contract and override `_initialize` and `_migrate` methods if neccessary.
 */
abstract contract VaultImplBase is IERC1822Proxiable, ERC1967Upgrade {
  // ======================
  // VaultImplBase specific
  // ======================

  /**
   * @notice Set the Implementation deployer as an admin.
   */
  constructor() {
    ERC1967Upgrade._changeAdmin(msg.sender);
  }

  address private immutable __self = address(this);

  /**
    * @notice Check that the execution is being performed through a delegatecall call and that the execution context is
    * a proxy contract with an implementation (as defined in ERC1967) pointing to self.
    */
  modifier onlyProxy() {
      require(address(this) != __self, "must be called through delegatecall");
      require(_getImplementation() == __self, "must be called through active proxy");
      _;
  }

  /**
    * @notice Check that the execution is not being performed through a delegate call. This allows a function to be
    * callable on the implementing contract but not through proxies.
    */
  modifier notDelegated() {
      require(address(this) == __self, "must not be called through delegatecall");
      _;
  }

  /**
   * @notice Check that the called is an address stored in `_ADMIN_SLOT`.
   * @dev Admin differs depending on the caller. If called via Proxy, then Proxy's storage is checked.
   * If called directly, this contract's storage is checked. This logic allows to have a different Proxy and Implementation admins.
   */
  modifier onlyAdmin() {
    require(msg.sender == ERC1967Upgrade._getAdmin(), 'caller not admin');
    _;
  }

  // ======================
  // Caller-specific storage
  // ======================
  /**
   * @notice Get an admin stored in `_ADMIN_SLOT`.
   * @dev Admin differs depending on the caller. If called via Proxy, then Proxy's storage is checked.
   * If called directly, this contract's storage is checked. This logic allows to have a different Proxy and Implementation admins.
   * @return address Admin address.
   */
  function getAdmin() external view returns (address) {
    return ERC1967Upgrade._getAdmin();
  }

  /**
   * @notice Set an admin address in `_ADMIN_SLOT`.
   * @dev Require the called to be an admin.
   * Admin differs depending on the caller. If called via Proxy, then Proxy's storage is checked.
   * If called directly, this contract's storage is checked. This logic allows to have a different Proxy and Implementation admins.
   * Emits `AdminChanged` event.
   * @param newAdmin Address of a new admin.
   */
  function changeAdmin(address newAdmin) external onlyAdmin {
    ERC1967Upgrade._changeAdmin(newAdmin);
  }

  // ======================
  // Implementation context storage
  // ======================
  /**
   * @dev Indicates that a newer implemenetation address was set.
   * @param newerImplementation Address of a newer implementation that was set.
   */
  event NewerImplementationSet(address indexed newerImplementation);

  /** @dev Double underscore enables using the same variable name with a single underscore in a derived contract */
  address private __newerImplementation;

  /**
   * @notice Return newer implementation contract address or zero address if not set yet.
   * NewerImplementation points to the newer implementation contract in a chain of contracts to allow upgrading.
   * @dev Must not be a delegated call.
   * @return address Newer implementation contract address or zero address if not set yet.
   */
  function getNewerImplementation() external view notDelegated returns (address) {
    return __newerImplementation;
  }

  /**
   * @notice Set newer implementation contract address if not set yet.
   * NewerImplementation points to the newer implementation contract in a chain of contracts to allow upgrading.
   * @dev Must not be a delegated call. Require caller to be Implementation admin. Must not be zero address or self address.
   * Emits `NewerImplementationSet` event.
   * @param newerImplementation Newer implementation contract address.
   */
  function setNewerImplementation(address newerImplementation) external notDelegated onlyAdmin {
    require(__newerImplementation == address(0), 'newerImplementation is already set');
    // prevent unnecessary event emitions & infinite newerImplementaion chain
    require(
      newerImplementation != address(0) && newerImplementation != __self,
      'invalid newerImplementation supplied'
    );
    
    __newerImplementation = newerImplementation;
    
    emit NewerImplementationSet(newerImplementation);
  }
  
  /**
    * @dev Implementation of the ERC1822 function. This returns the storage slot used by the
    * implementation. It is used to validate the implementation's compatibility when performing an upgrade.
    */
  function proxiableUUID() external view virtual override notDelegated returns (bytes32) {
      return ERC1967Upgrade._IMPLEMENTATION_SLOT;
  }

  // ======================
  // Proxy context storage
  // ======================
  bool private __initialized;
  bool private __migrated;

  /**
   * @notice Override this function for Implementation to initialize any storage variables. Use instead of constructor.
   * @dev Can only be called by Proxy.
   */
  function _initialize() internal virtual onlyProxy {}

  /**
   * @notice Call `_initialize_ defined by the Implementation to initialize any storage variables.
   * @dev Can only be called by Proxy.
   */
  function initialize() external onlyProxy {
    require(__initialized == false, 'already initialized');
    __initialized = true;
    __migrated = true;
    _initialize();
  }

  /**
   * @notice Override this function for Implementation to migrate any storage variables between different implementation versions if needed.
   * @dev Can only be called by Proxy.
   */
  function _migrate() internal virtual onlyProxy {}

  /**
   * @notice Call `_migrate` defined by the Implmentation to migrate any storage variables. Call `upgrade` function on itself to ensure the this contract is the latest version.
   * @dev Can only be called by Proxy.
   */
  function applyUpgrade() external onlyProxy {
    require(__migrated == false, 'already migrated');
    __migrated = true;
    _migrate();
    
    if (VaultImplBase(_getImplementation()).getNewerImplementation() != address(0)) {
      // do recursive upgrade
      upgrade();
    }
  }

  /**
   * @notice Perform an upgrade from the current implementation contract to a newer one specified in a current Implementation. Also calls `applyUpgrade` on a newer implementation.
   * @dev Require called to be Proxy admin. Can only be called by Proxy.
   */
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

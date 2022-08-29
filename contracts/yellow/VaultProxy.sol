//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/proxy/Proxy.sol';
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Upgrade.sol';
import './VaultImplBase.sol';

/**
 * @dev Logic for the Proxy, defining the `upgradeTo` and `upgradeToAndCall` methods alongside with the slots for the Implementation to use.
 */
contract VaultProxy is Proxy, ERC1967Upgrade { // Admin AccessControl logic is present in ERC1967Proxy itself
  constructor() {
    ERC1967Upgrade._changeAdmin(msg.sender);

    // Point to the first VaultImpl in the versions chain
    address newImplementation = 0x93f8dddd876c7dBE3323723500e83E202A7C96CC;
    address newerImplementation = address(0);

    while (true) {
      newerImplementation = VaultImplBase(newImplementation).getNewerImplementation();

      if (newerImplementation == address(0)) {
        break;
      }

      newImplementation = newerImplementation;
    }

    _upgradeToAndCall(
      newImplementation,
      abi.encodeWithSelector(bytes4(keccak256("initialize()"))),
      true
    );
  }

  modifier onlyAdmin() {
    require(msg.sender == ERC1967Upgrade._getAdmin(), 'caller not admin');
    _;
  }

  function _implementation() override internal view returns (address) {
    return ERC1967Upgrade._getImplementation();
  }

  // May be needed for block explorers go supply users with the actual implementation contract info
  function getImplementation() external view returns (address) {
    return ERC1967Upgrade._getImplementation();
  }

  function getAdmin() external view returns (address) {
    return ERC1967Upgrade._getAdmin();
  }

  function changeAdmin(address newAdmin) external onlyAdmin {
    ERC1967Upgrade._changeAdmin(newAdmin);
  }
}

//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Upgrade.sol';

/**
 * @dev Logic for the Proxy, defining the `upgradeTo` and `upgradeToAndCall` methods alongside with the slots for the Implementation to use.
 */
contract VaultProxy is ERC1967Proxy { // Admin AccessControl logic is present in ERC1967Proxy itself
  constructor(address initialLogic) ERC1967Proxy(initialLogic, "") {}

  modifier onlyAdmin() {
    require(msg.sender == ERC1967Upgrade._getAdmin(), 'caller not admin');
    _;
  }

  // May be needed for block explorers go supply users with the actual implementation contract info
  function getImplementation() external view returns (address) {
    return ERC1967Upgrade._getImplementation();
  }

  // TODO: do we need it?
  function getAdmin() external view returns (address) {
    return ERC1967Upgrade._getAdmin();
  }

  function changeAdmin(address newAdmin) external onlyAdmin {
    ERC1967Upgrade._changeAdmin(newAdmin);
  }
}

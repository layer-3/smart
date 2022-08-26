//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import '@openzeppelin/contracts/access/AccessControl.sol';
import './interfaces/IVaultImplRegistry.sol';

contract VaultImplRegistry is IVaultImplRegistry, AccessControl {
  bytes32 public constant MAINTAINER_ROLE = keccak256("MAINTAINER_ROLE");

  address[] private implementationAddresses;

  constructor() {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MAINTAINER_ROLE, msg.sender);
  }

  function pushAddress(address _addr) override external onlyRole(MAINTAINER_ROLE) {
    require(_indexOf(_addr) == -1, "address already present");
    implementationAddresses.push(_addr);
  }

  function lastAddress() override external view returns (address) {
    if (implementationAddresses.length == 0) {
      return address(0);
    }
    
    return implementationAddresses[implementationAddresses.length - 1];
  }

  function nextAddress(address _addr) override external view returns (address) {
    int256 addrIndex = _indexOf(_addr);

    if (addrIndex == -1 ||
      addrIndex == int256(implementationAddresses.length - 1)) {
      return address(0);
    }

    return implementationAddresses[uint256(addrIndex + 1)];
  }

  function _indexOf(address _addr) internal view returns (int256) {
    for (uint256 i = 0; i < implementationAddresses.length; i++) {
      if (_addr == implementationAddresses[i]) {
        return int256(i);
      }
    }

    return -1;
  }
}

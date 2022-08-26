//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

interface IVaultImplRegistry {
  function pushAddress(address _addr) external;

  function lastAddress() external view returns (address);

  function nextAddress(address _addr) external view returns (address);

  event AddressAdded(address _addr);
}

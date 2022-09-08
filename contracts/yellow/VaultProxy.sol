//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import './VaultProxyBase.sol';

/**
 * @notice Proxy contract contraining all delegate logic and hardcoded start implementation contract address.
 * For more information see `VaultProxyBase.sol`.
 */
contract VaultProxy is VaultProxyBase(0x93f8dddd876c7dBE3323723500e83E202A7C96CC) {}

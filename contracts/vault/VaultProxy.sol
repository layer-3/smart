//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import './VaultProxyBase.sol';
import './VaultImplV1.sol';

/**
 * @notice Proxy contract contraining all delegate logic and hardcoded start implementation contract address.
 * For more information see `VaultProxyBase.sol`.
 */
contract VaultProxy is VaultProxyBase(VaultImplV1(0x0000000000000000000000000000000000000000)) {

}

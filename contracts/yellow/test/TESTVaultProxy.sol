//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../VaultProxyBase.sol';

/**
 * @dev Use for TEST PURPOSES ONLY. !!! Contains security vulnerability !!!
 */
contract TESTVaultProxy is VaultProxyBase {
    constructor(address startImplementation) VaultProxyBase(startImplementation) {}
    // SECUTIRY VULNERABILITY HERE ^^^
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
}

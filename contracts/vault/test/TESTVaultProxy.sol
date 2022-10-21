//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../VaultProxyBase.sol';
import '../VaultImplBase.sol';

/**
 * @dev Use for TEST PURPOSES ONLY. !!! Contains security vulnerability !!!
 */
contract TESTVaultProxy is VaultProxyBase {
	constructor(VaultImplBase startImplementation) VaultProxyBase(startImplementation) {}
	// SECURITY VULNERABILITY HERE ^^^
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
}

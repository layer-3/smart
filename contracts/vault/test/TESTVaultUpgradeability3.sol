//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../VaultImplBase.sol';

/**
 * @notice Implementation contract V2 for testing.
 */
contract TESTVaultUpgradeability3 is VaultImplBase {
	// used for testing
	uint256 public initializedVersion;
	uint256 public migrationInvoked;

	// does not take storage slot
	uint256 public constant version = 3;

	// Proxy calls this upon linking
	function _initialize() internal override {
		initializedVersion = 3;
	}

	function _migrate() internal override {
		migrationInvoked += 1;
	}
}

//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '../VaultImplBase.sol';

/**
 * @notice Implementation contract V2 for testing.
 */
contract TESTVaultUpgradeability2 is VaultImplBase {
	// used for testing
	uint256 public initializedVersion;
	uint256 public migrationInvoked;

	// does not take storage slot
	uint256 public constant VERSION = 2;

	// Proxy calls this upon linking
	function _initialize() internal override {
		initializedVersion = 2;
	}

	function presentV2AbsentV1() external pure returns (bool) {
		return true;
	}

	function _migrate() internal override {
		migrationInvoked += 1;
	}
}

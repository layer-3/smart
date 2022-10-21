//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../VaultImplBase.sol';

/**
 * @notice Implementation contract V1 for testing.
 */
contract TESTVaultUpgradeability1 is VaultImplBase {
	// used for testing
	uint256 public initializedVersion;
	uint256 public migrationInvoked;

	// does not take storage slot
	uint256 public constant version = 1;

	// Proxy calls this upon linking
	function _initialize() internal override {
		initializedVersion = 1;
		migrationInvoked = 0;
	}

	function presentV1AbsentV2() external pure returns (bool) {
		return true;
	}
}

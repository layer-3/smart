//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../Upgradeability.sol';
import '../Registry.sol';

contract TESTYellowClearingV2 is Upgradeability, Registry {
	constructor(Upgradeability previousImplementation) Upgradeability(previousImplementation) {}

	// can introduce new storage variables
	uint256 public newStorageVariable = 42;

	// can introduce new functions
	function newFunctionPresent() external pure returns (bool) {
		return true;
	}
}

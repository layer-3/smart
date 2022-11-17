//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '../ClearingMigratable.sol';
import '../interfaces/IPrevImplementation.sol';

contract TESTYellowClearingV2 is ClearingMigratable {
	constructor(IPrevImplementation previousImplementation)
		ClearingMigratable(previousImplementation)
	{}

	// can introduce new storage variables
	uint256 public newStorageVariable = 42;

	// can introduce new functions
	function newFunctionPresent() external pure returns (bool) {
		return true;
	}
}

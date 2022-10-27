//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../YellowClearingBase.sol';
import './TESTYellowClearingV1.sol';

contract TESTYellowClearingV2 is YellowClearingBase {
	constructor(YellowClearingBase previousImplementation)
		YellowClearingBase(previousImplementation)
	{}

	// can introduce new storage variables
	uint256 public newStorageVariable = 42;

	// can introduce new functions
	function newFunctionPresent() external pure returns (bool) {
		return true;
	}
}

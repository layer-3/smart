//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '../ClearingMigratable.sol';
import '../interfaces/IPrevImplementation.sol';

/**
 * @dev Use for TEST PURPOSES ONLY. !!! Contains security vulnerability !!!
 */
contract TESTYellowClearingV1 is ClearingMigratable {
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// SECURITY VULNERABILITY HERE \/ \/ \/
	constructor(IPrevImplementation previousImplementation)
		ClearingMigratable(previousImplementation)
	{}
}

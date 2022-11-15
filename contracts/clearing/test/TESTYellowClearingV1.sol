//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../YellowClearingUpgradeability.sol';
import '../YellowRegistry.sol';

/**
 * @dev Use for TEST PURPOSES ONLY. !!! Contains security vulnerability !!!
 */
contract TESTYellowClearingV1 is YellowClearingUpgradeability, YellowRegistry {
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// SECURITY VULNERABILITY HERE \/ \/ \/
	constructor(YellowClearingUpgradeability previousImplementation)
		YellowClearingUpgradeability(previousImplementation)
	{}
}

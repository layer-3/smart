//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../Upgradeability.sol';
import '../Registry.sol';

/**
 * @dev Use for TEST PURPOSES ONLY. !!! Contains security vulnerability !!!
 */
contract TESTYellowClearingV1 is Upgradeability, Registry {
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// SECURITY VULNERABILITY HERE \/ \/ \/
	constructor(Upgradeability previousImplementation) Upgradeability(previousImplementation) {}
}

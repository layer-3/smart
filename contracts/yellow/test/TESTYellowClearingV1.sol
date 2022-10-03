//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../YellowClearingBase.sol';

/**
 * @dev Use for TEST PURPOSES ONLY. !!! Contains security vulnerability !!!
 */
contract TESTYellowClearingV1 is YellowClearingBase {
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // SECUTIRY VULNERABILITY HERE \/ \/ \/
    constructor(YellowClearingBase previousImplementation)
      YellowClearingBase(previousImplementation) {}
}

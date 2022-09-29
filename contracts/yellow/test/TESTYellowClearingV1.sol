//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../YellowClearingBase.sol';

contract TESTYellowClearingV1 is YellowClearingBase {
    // Constructor
    constructor()
        YellowClearingBase(YellowClearingBase(0x0000000000000000000000000000000000000000))
    {}
}

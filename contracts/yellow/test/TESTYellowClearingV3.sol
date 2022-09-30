//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../YellowClearingBase.sol';
import './TESTYellowClearingV1.sol';

contract TESTYellowClearingV3 is YellowClearingBase {
    constructor() YellowClearingBase(3) {}
}

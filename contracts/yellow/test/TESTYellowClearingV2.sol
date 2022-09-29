//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../YellowClearingBase.sol';
import './TESTYellowClearingV1.sol';

contract TESTYellowClearingV2 is YellowClearingBase {
    // address of previous clearing contract version is supplied for easier testing
    constructor(TESTYellowClearingV1 clearingV1)
        YellowClearingBase(clearingV1)
    {}

    // can introduce new storage variables
    uint256 newStorageVariable = 42;

    // can introduce new functions
    function newFunctionPresent() external pure returns (bool) {
      return true;
    }
}
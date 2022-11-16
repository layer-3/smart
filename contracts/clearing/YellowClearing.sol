//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import './ClearingMigratable.sol';
import './interfaces/IPrevImplementation.sol';

// NOTE: Substitute with address of previous version YellowClearing
contract YellowClearing is ClearingMigratable(IPrevImplementation(address(0))) {

}

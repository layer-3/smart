//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import './YellowClearingUpgradeability.sol';
import './YellowRegistry.sol';

/**
 * @dev Implementation for the YellowClearing. Version 1.0.
 */
contract YellowClearingV1 is
	YellowClearingUpgradeability(YellowClearingUpgradeability(address(0))),
	YellowRegistry
{

}

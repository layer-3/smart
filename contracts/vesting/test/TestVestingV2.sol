//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '../Vesting.sol';

contract TestVestingV2 is Vesting {
	bool public constant AVAILABLE_AFTER_UPGRADE = true;
}

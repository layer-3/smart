//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../Upgradeability.sol';

interface INextImplementation {
	function getRightmostImplementation() external view returns (address);

	function isRightImplementation(Upgradeability impl) external returns (bool);

	function requireParticipantNotPresentBackwards(address participant) external view;

	function requireParticipantNotPresentForwards(address participant) external view;

	function requireParticipantNotPresentRecursive(address participant) external view;
}

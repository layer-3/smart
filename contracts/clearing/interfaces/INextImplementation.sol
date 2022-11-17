//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '../Registry.sol';
import './IPrevImplementation.sol';
import '../Upgradeability.sol';

// TODO: tidy
interface INextImplementation {
	function getRightmostImplementation() external view returns (address);

	function isRightImplementation(Upgradeability impl) external view returns (bool);

	function requireParticipantNotPresentBackwards(address participant) external view;

	function requireParticipantNotPresentForwards(address participant) external view;

	function requireParticipantNotPresentRecursive(address participant) external view;

	function migrateParticipantDataConsequtive(
		address participant,
		Registry.ParticipantData memory prevVersionData
	) external;
}

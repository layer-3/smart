//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../Upgradeability.sol';
import '../Registry.sol';

contract TESTYellowClearingV3 is Upgradeability, Registry {
	constructor(Upgradeability previousImplementation) Upgradeability(previousImplementation) {}

	function _migrateParticipantData(address participant, ParticipantData memory data)
		public
		override
		onlyLeftImplementation(this)
	{
		ParticipantData memory migratedData = ParticipantData(data.status, 42);

		_participantData[participant] = migratedData;
	}
}

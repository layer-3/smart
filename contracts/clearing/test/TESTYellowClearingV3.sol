//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../ClearingMigratable.sol';
import '../interfaces/IPrevImplementation.sol';

contract TESTYellowClearingV3 is ClearingMigratable {
	constructor(IPrevImplementation previousImplementation)
		ClearingMigratable(previousImplementation)
	{}

	function migrateParticipantData(address participant, ParticipantData memory data)
		public
		override
		onlyRightImplementation(this)
	{
		ParticipantData memory migratedData = ParticipantData(data.status, 42);

		_participantData[participant] = migratedData;
	}
}

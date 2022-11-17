//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '../ClearingMigratable.sol';
import '../interfaces/IPrevImplementation.sol';

contract TESTYellowClearingV3 is ClearingMigratable {
	constructor(IPrevImplementation previousImplementation)
		ClearingMigratable(previousImplementation)
	{}

	function migrateParticipantData(
		address participant,
		IPrevImplementation.ParticipantData memory data
	) public override onlyRole(PREVIOUS_IMPLEMENTATION_ROLE) {
		Registry.ParticipantStatus status = ParticipantStatus(uint8(data.status));
		ParticipantData memory migratedData = ParticipantData(status, 42);

		_participantData[participant] = migratedData;
	}
}

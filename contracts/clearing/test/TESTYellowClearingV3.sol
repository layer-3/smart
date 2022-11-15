//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../YellowClearingUpgradeability.sol';
import '../YellowRegistry.sol';

contract TESTYellowClearingV3 is YellowClearingUpgradeability, YellowRegistry {
	constructor(YellowClearingUpgradeability previousImplementation)
		YellowClearingUpgradeability(previousImplementation)
	{}

	function _migrateParticipantData(address participant, ParticipantData memory data)
		public
		override
		onlyLeftImplementation(this)
	{
		ParticipantData memory migratedData = ParticipantData(data.status, data.nonce, 42);

		_participantData[participant] = migratedData;
	}
}

//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import './Registry.sol';
import './Channel.sol';

abstract contract RegistryWithStacking is Registry, Channel {
	// ======================
	// Participant
	// ======================

	struct ParticipantData {
		Status status;
		uint64 registrationTime;
		Status reinstateStatus;
		uint256 stackedTokens;
		uint256 lockedTokens;
	}

	/**
	 * @notice Get participant data stored in the registry. Revert if participant is not present.
	 * @dev Get participant data stored in the registry. Revert if participant is not present.
	 * @param participant Address of participant to get data about.
	 * @return ParticipantData Participant data.
	 */
	function getParticipantData(address participant)
		external
		view
		virtual
		returns (ParticipantData memory)
	{
		_requireParticipantExists(participant);

		return
			ParticipantData({
				status: statusOf[participant],
				registrationTime: registrationTimeOf[participant],
				reinstateStatus: reinstateStatusOf[participant],
				stackedTokens: stackedBy[participant],
				lockedTokens: lockedBy[participant]
			});
	}

	// ======================
	// Stacking
	// ======================

	function _requireEligibleForStacking(address participant) internal virtual override {
		_requireParticipantExists(participant);
	}

	function _requireEligibleForUnstacking(
		address participant,
		bytes memory identifyPayloadSignature
	) internal virtual override {
		_identifyRequest(participant, identifyPayloadSignature);
	}

	// ======================
	// Internal
	// ======================

	function _getParticipantData(address participant)
		internal
		view
		returns (ParticipantData memory)
	{
		return
			ParticipantData({
				status: statusOf[participant],
				registrationTime: registrationTimeOf[participant],
				reinstateStatus: reinstateStatusOf[participant],
				stackedTokens: stackedBy[participant],
				lockedTokens: lockedBy[participant]
			});
	}
}

//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '@openzeppelin/contracts/access/AccessControl.sol';

abstract contract Registry is AccessControl {
	enum Status {
		// Participant does not exists or have been deleted
		None,
		// Participant exists and is pending activation
		Pending,
		// Participant exists and is active
		Active,
		// Participant exists but is suspended
		Suspended,
		// Participant is registered but have migrated to a newer implementation
		Migrated
	}

	bytes32 public constant REGISTRY_MODERATOR_ROLE = keccak256('REGISTRY_MODERATOR_ROLE');
	bytes32 public constant REGISTRY_VALIDATOR_ROLE = keccak256('REGISTRY_VALIDATOR_ROLE');

	mapping(address => Status) public status;
	mapping(address => uint64) public registrationTime;
	mapping(address => Status) public reinstateStatus;

	function _requireParticipantExists(address participant) internal view {
		require(status[participant] != Status.None, 'participant does not exist');
	}

	function activateParticipant(address participant) external onlyRole(REGISTRY_VALIDATOR_ROLE) {
		require(status[participant] == Status.Pending, 'participant is not pending activation');

		status[participant] = Status.Active;

		emit ParticipantStatusChanged(participant, Status.Active);
	}

	function suspendParticipant(address participant) external onlyRole(REGISTRY_MODERATOR_ROLE) {
		_requireParticipantExists(participant);

		Status sts = status[participant];

		require(sts != Status.Suspended, 'participant is already suspended');
		require(sts != Status.Migrated, 'participant has migrated');

		reinstateStatus[participant] = sts;

		status[participant] = Status.Suspended;

		emit ParticipantStatusChanged(participant, Status.Suspended);
	}

	function reinstateParticipant(address participant) external onlyRole(REGISTRY_MODERATOR_ROLE) {
		require(status[participant] == Status.Suspended, 'participant is not suspended');

		status[participant] = reinstateStatus[participant];

		delete reinstateStatus[participant];

		emit ParticipantStatusChanged(participant, Status.Active);
	}

	event ParticipantStatusChanged(address indexed participant, Status indexed status);
}

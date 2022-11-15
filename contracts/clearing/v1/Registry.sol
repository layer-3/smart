//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/access/AccessControl.sol';

import './Identity.sol';

abstract contract Registry is AccessControl, Identity {
	enum Status {
		// Participant does not exists or have been deleted
		None,
		// Participant exists and is pending validation
		Pending,
		// Participant exists and is validated
		Active,
		// Participant exists but is suspended
		Suspended,
		// Participant is registered but have migrated to a newer implementation
		Migrated
	}

	bytes32 public constant REGISTRY_MODERATOR_ROLE = keccak256('REGISTRY_MODERATOR_ROLE');
	bytes32 public constant REGISTRY_VALIDATOR_ROLE = keccak256('REGISTRY_VALIDATOR_ROLE');

	mapping(address => Status) internal _status;
	mapping(address => uint64) internal _registrationTime;
	mapping(address => Status) internal _reinstateStatus;

	function hasParticipant(address participant) public view returns (bool) {
		return _status[participant] != Status.None;
	}

	function _requireParticipantExists(address participant) internal view {
		require(hasParticipant(participant), 'participant does not exist');
	}

	function getParticipantStatus(address participant) external view returns (Status) {
		return _status[participant];
	}

	function getParticipantRegistrationTime(address participant) external view returns (uint64) {
		return _registrationTime[participant];
	}

	function validateParticipant(address participant) external onlyRole(REGISTRY_VALIDATOR_ROLE) {
		_requireParticipantExists(participant);

		require(_status[participant] == Status.Pending, 'participant is not pending validation');

		_status[participant] = Status.Active;

		emit ParticipantStatusChanged(participant, Status.Active);
	}

	function suspendParticipant(address participant) external onlyRole(REGISTRY_MODERATOR_ROLE) {
		_requireParticipantExists(participant);

		Status status = _status[participant];

		require(status != Status.Suspended, 'participant is already suspended');
		require(status != Status.Migrated, 'participant has migrated');

		_reinstateStatus[participant] = status;

		_status[participant] = Status.Suspended;

		emit ParticipantStatusChanged(participant, Status.Suspended);
	}

	function reinstateParticipant(address participant) external onlyRole(REGISTRY_MODERATOR_ROLE) {
		_requireParticipantExists(participant);

		require(_status[participant] == Status.Suspended, 'participant is not suspended');

		_status[participant] = _reinstateStatus[participant];

		delete _reinstateStatus[participant];

		emit ParticipantStatusChanged(participant, Status.Active);
	}

	event ParticipantStatusChanged(address indexed participant, Status indexed status);
}

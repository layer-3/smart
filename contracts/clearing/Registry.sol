//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

import './Upgradeability.sol';
import './Identity.sol';

// YellowParticipant
abstract contract Registry is AccessControl, Identity {
	// ======================
	// Structs
	// ======================

	using ECDSA for bytes32;

	// Participant status
	enum ParticipantStatus {
		// Participant is not registered or have been removed
		None,
		// Participant is registered but not yet validated
		Pending,
		// Participant is registered but do not have token staked
		Inactive,
		// Participant is registered and have token staked
		Active,
		// Participant is registered but is not allowed to participate
		Suspended,
		// Participant is registered but have migrated to the next implementation
		Migrated
	}

	// Participant data
	struct ParticipantData {
		ParticipantStatus status;
		uint64 registrationTime;
	}

	// ======================
	// Roles
	// ======================

	bytes32 public constant REGISTRY_MAINTAINER_ROLE = keccak256('REGISTRY_MAINTAINER_ROLE');
	bytes32 public constant REGISTRY_VALIDATOR_ROLE = keccak256('REGISTRY_VALIDATOR_ROLE');
	bytes32 public constant AUDITOR_ROLE = keccak256('AUDITOR_ROLE');

	// ======================
	// Fields
	// ======================

	// Participant data mapping
	mapping(address => ParticipantData) internal _participantData;

	// ======================
	// Participant checks
	// ======================

	/**
	 * @notice Check if participant is present in the registry. Participant is not present if it is not stored in the mapping or has `ParticipantStatus.None`.
	 * @dev Check if participant is present in the registry. Participant is not present if it is not stored in the mapping or has `ParticipantStatus.None`.
	 * @return True if participant is present, false otherwise.
	 */
	function hasParticipant(address participant) public view returns (bool) {
		return _participantData[participant].status != ParticipantStatus.None;
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
		returns (ParticipantData memory)
	{
		_requireParticipantPresent(participant);

		return _participantData[participant];
	}

	// ======================
	// Participant changes
	// ======================

	// REVIEW: change docs comment after checks are added
	/**
	 * @notice Validate participant and, depending on checks to be added, set their status to either Active or Inactive. Emit `ParticipantStatusChanged` event.
	 * @dev Require REGISTRY_VALIDATOR_ROLE to invoke. Participant must be present with Pending status.
	 * @param participant Address of participant to validate.
	 */
	function validateParticipant(address participant) external onlyRole(REGISTRY_VALIDATOR_ROLE) {
		_requireParticipantPresent(participant);
		require(
			_participantData[participant].status == ParticipantStatus.Pending,
			'Invalid status'
		);

		// status changes to either Active or Inactive depending on internal logic yet to be added
		_participantData[participant].status = ParticipantStatus.Active;

		emit ParticipantStatusChanged(participant, ParticipantStatus.Active);
	}

	// REVIEW: change docs comment after checks are added
	/**
	 * @notice Suspend participant and set their status to Suspended. Emit `ParticipantStatusChanged` event.
	 * @dev Require AUDITOR_ROLE to invoke. Participant must be present and not migrated
	 * @param participant Address of participant to suspend.
	 */
	function suspendParticipant(address participant) external onlyRole(AUDITOR_ROLE) {
		_requireParticipantPresent(participant);

		ParticipantStatus status = _participantData[participant].status;
		require(
			status != ParticipantStatus.None &&
				status != ParticipantStatus.Suspended &&
				status != ParticipantStatus.Migrated,
			'Invalid status'
		);

		_participantData[participant].status = ParticipantStatus.Suspended;

		emit ParticipantStatusChanged(participant, ParticipantStatus.Suspended);
	}

	// REVIEW: change docs comment after checks are added
	/**
	 * @notice Reinstate participant and, depending on checks to be added, set their status to either Active or Inactive. Emit `ParticipantStatusChanged` event.
	 * @dev Require AUDITOR_ROLE to invoke. Participant must have been suspended previously.
	 * @param participant Address of participant to reinstate.
	 */
	function reinstateParticipant(address participant) external onlyRole(AUDITOR_ROLE) {
		_requireParticipantPresent(participant);
		require(
			_participantData[participant].status == ParticipantStatus.Suspended,
			'Invalid status'
		);

		// status changes to either Active or Inactive depending on internal logic yet to be added
		_participantData[participant].status = ParticipantStatus.Active;

		emit ParticipantStatusChanged(participant, ParticipantStatus.Active);
	}

	/**
	 * @notice Set participant data to data supplied. Emit `ParticipantDataChanged` event.
	 * @dev Require REGISTRY_MAINTAINER_ROLE to invoke. Participant must not have been migrated.
	 * @param participant Address of participant to set data of.
	 * @param data Data to set.
	 */
	function setParticipantData(address participant, ParticipantData memory data)
		external
		onlyRole(REGISTRY_MAINTAINER_ROLE)
	{
		require(participant != address(0), 'Invalid participant address');

		require(
			_participantData[participant].status != ParticipantStatus.Migrated,
			'Participant already migrated'
		);

		_participantData[participant] = data;

		emit ParticipantDataSet(participant, data);
	}

	// ======================
	// Internal
	// ======================

	/**
	 * @notice Require participant it present in this registry.
	 * @dev Require participant it present in this registry.
	 * @param participant Address of participant to check.
	 */
	function _requireParticipantPresent(address participant) internal view {
		require(hasParticipant(participant), 'Participant does not exist');
	}

	/**
	 * @notice Require participant it not present in this registry.
	 * @dev Require participant it not present in this registry.
	 * @param participant Address of participant to check.
	 */
	function _requireParticipantNotPresent(address participant) internal view {
		require(!hasParticipant(participant), 'Participant already exist');
	}

	// ======================
	// Events
	// ======================

	event ParticipantStatusChanged(address indexed participant, ParticipantStatus indexed status);

	event ParticipantDataSet(address indexed participant, ParticipantData data);
}

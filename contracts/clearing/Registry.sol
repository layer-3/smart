//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

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
	enum Status {
		// Participant is not registered or have been removed
		None,
		// Participant is registered but not yet validated
		Pending,
		// Participant is registered and have token stacked
		Active,
		// Participant is registered but is not allowed to participate
		Suspended,
		// Participant is registered but have migrated to the next implementation
		Migrated
	}

	// ======================
	// Roles
	// ======================

	bytes32 public constant REGISTRY_MAINTAINER_ROLE = keccak256('REGISTRY_MAINTAINER_ROLE');
	bytes32 public constant REGISTRY_VALIDATOR_ROLE = keccak256('REGISTRY_VALIDATOR_ROLE');
	bytes32 public constant REGISTRY_MODERATOR_ROLE = keccak256('REGISTRY_MODERATOR_ROLE');

	// ======================
	// Fields
	// ======================

	mapping(address => Status) public statusOf;
	mapping(address => uint64) public registrationTimeOf;
	mapping(address => Status) public reinstateStatusOf;

	// participant => associated addresses
	mapping(address => address[]) public associatedAddressesOf;
	// associated address => participant
	mapping(address => address) public associatedParticipantOf;

	// ======================
	// Participant checks
	// ======================

	/**
	 * @notice Check if participant is present in the registry. Participant is not present if it is not stored in the mapping or has `Status.None`.
	 * @dev Check if participant is present in the registry. Participant is not present if it is not stored in the mapping or has `Status.None`.
	 * @return True if participant is present, false otherwise.
	 */
	function participantExists(address participant) public view returns (bool) {
		return _participantExists(participant);
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
		_requireParticipantExists(participant);
		require(statusOf[participant] == Status.Pending, 'Invalid status');

		// status changes to either Active or Inactive depending on internal logic yet to be added
		statusOf[participant] = Status.Active;

		emit ParticipantStatusChanged(participant, Status.Active);
	}

	// REVIEW: change docs comment after checks are added
	/**
	 * @notice Suspend participant and set their status to Suspended. Emit `ParticipantStatusChanged` event.
	 * @dev Require REGISTRY_MODERATOR_ROLE to invoke. Participant must be present and not migrated
	 * @param participant Address of participant to suspend.
	 */
	function suspendParticipant(address participant) external onlyRole(REGISTRY_MODERATOR_ROLE) {
		_requireParticipantExists(participant);

		Status status = statusOf[participant];
		require(
			status != Status.None && status != Status.Suspended && status != Status.Migrated,
			'Invalid status'
		);

		reinstateStatusOf[participant] = status;

		statusOf[participant] = Status.Suspended;

		emit ParticipantStatusChanged(participant, Status.Suspended);
	}

	// REVIEW: change docs comment after checks are added
	/**
	 * @notice Reinstate participant and, depending on checks to be added, set their status to either Active or Inactive. Emit `ParticipantStatusChanged` event.
	 * @dev Require REGISTRY_MODERATOR_ROLE to invoke. Participant must have been suspended previously.
	 * @param participant Address of participant to reinstate.
	 */
	function reinstateParticipant(address participant) external onlyRole(REGISTRY_MODERATOR_ROLE) {
		_requireParticipantExists(participant);
		require(statusOf[participant] == Status.Suspended, 'Invalid status');

		statusOf[participant] = reinstateStatusOf[participant];

		delete reinstateStatusOf[participant];

		emit ParticipantStatusChanged(participant, Status.Active);
	}

	function setParticipantStatus(address participant, Status status)
		external
		onlyRole(REGISTRY_MAINTAINER_ROLE)
	{
		statusOf[participant] = status;

		emit ParticipantStatusSet(participant, status);
	}

	// ======================
	// Associated address
	// ======================

	function addAssociatedAddress(
		address participant,
		address associatedAddress,
		bytes memory identityPayloadSignature
	) external {
		_requireParticipantExists(participant);

		_identifyRequest(participant, identityPayloadSignature);

		require(
			associatedParticipantOf[associatedAddress] == address(0),
			'associated address already in use'
		);

		associatedAddressesOf[participant].push(associatedAddress);
		associatedParticipantOf[associatedAddress] = participant;

		emit AssociatedAddressAdded(participant, associatedAddress);
	}

	function removeAssociatedAddress(
		address participant,
		address associatedAddress,
		bytes memory identityPayloadSignature
	) external {
		_requireParticipantExists(participant);

		_identifyRequest(participant, identityPayloadSignature);

		require(
			associatedParticipantOf[associatedAddress] == participant,
			'associated address does not belong to participant'
		);

		delete associatedParticipantOf[associatedAddress];

		address[] storage associatedAddrs = associatedAddressesOf[participant];
		for (uint256 i = 0; i < associatedAddrs.length; i++) {
			if (associatedAddrs[i] == associatedAddress) {
				associatedAddrs[i] = associatedAddrs[associatedAddrs.length - 1];
				associatedAddrs.pop();

				break;
			}
		}

		emit AssociatedAddressRemoved(participant, associatedAddress);
	}

	// ======================
	// Internal
	// ======================

	/**
	 * @notice Require participant it present in this registry.
	 * @dev Require participant it present in this registry.
	 * @param participant Address of participant to check.
	 */
	function _requireParticipantExists(address participant) internal view {
		require(_participantExists(participant), 'Participant does not exist');
	}

	/**
	 * @notice Require participant it not present in this registry.
	 * @dev Require participant it not present in this registry.
	 * @param participant Address of participant to check.
	 */
	function _requireParticipantNotExist(address participant) internal view {
		require(!_participantExists(participant), 'Participant already exist');
	}

	function _participantExists(address participant) internal view returns (bool) {
		return statusOf[participant] != Status.None;
	}

	// ======================
	// Events
	// ======================

	event ParticipantStatusChanged(address indexed participant, Status indexed status);

	event ParticipantStatusSet(address indexed participant, Status indexed status);

	event AssociatedAddressAdded(address indexed participant, address indexed associatedAddress);

	event AssociatedAddressRemoved(address indexed participant, address indexed associatedAddress);
}

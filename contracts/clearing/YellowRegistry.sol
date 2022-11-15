//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

import './YellowAccessControl.sol';
import './YellowClearingUpgradeability.sol';
import './IYellowParticipant.sol';
import './YellowLocking.sol';

// YellowParticipant
abstract contract YellowRegistry is
	YellowAccessControl,
	YellowClearingUpgradeability,
	IYellowParticipant,
	YellowLocking
{
	using ECDSA for bytes32;

	// Participant data mapping
	mapping(address => ParticipantData) internal _participantData;

	// ======================
	// participant checks
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
	 * @notice Recursively check that participant is not present in this registry and all previous ones.
	 * @dev Recursively check that participant is not present in this registry and all previous ones.
	 * @param participant Address of participant to check.
	 */
	function requireParticipantNotPresentBackwards(address participant) public view {
		if (address(_prevImplementation) != address(0)) {
			YellowRegistry(address(_prevImplementation)).requireParticipantNotPresentBackwards(
				participant
			);
		}

		_requireParticipantNotPresent(participant);
	}

	/**
	 * @notice Recursively check that participant is not present in this registry and all subsequent ones.
	 * @dev Recursively check that participant is not present in this registry and all subsequent ones.
	 * @param participant Address of participant to check.
	 */
	function requireParticipantNotPresentForwards(address participant) public view {
		if (address(_nextImplementation) != address(0)) {
			YellowRegistry(address(_nextImplementation)).requireParticipantNotPresentForwards(
				participant
			);
		}

		_requireParticipantNotPresent(participant);
	}

	/**
	 * @notice Recursively check that participant is not present in this registry and all previous and subsequent ones.
	 * @dev Recursively check that participant is not present in this registry and all previous and subsequent ones.
	 * @param participant Address of participant to check.
	 */
	function requireParticipantNotPresentRecursive(address participant) public view {
		requireParticipantNotPresentBackwards(participant);
		requireParticipantNotPresentForwards(participant);
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

	/**
	 * @notice Return identity payload structure for a supplied participant. Used to ease interaction with this contract.
	 * @dev Return identity payload structure for a supplied participant. Used to ease interaction with this contract.
	 * @param participant Address of participant to get identity payload for.
	 * @return IdentityPayload Identity payload structure for a supplied participant.
	 */
	function getIdentityPayload(address participant) public view returns (IdentityPayload memory) {
		uint64 nonce;

		if (!hasParticipant(participant)) {
			nonce = 0;
		} else {
			nonce = _participantData[participant].nonce + 1;
		}

		return
			IdentityPayload({
				yellowRegistry: address(_self),
				participant: participant,
				nonce: nonce
			});
	}

	// ======================
	// participant changes
	// ======================

	/**
	 * @notice Register participant by adding it to the registry with Pending status. Emit `ParticipantRegistered` event.
	 * @dev Participant must not be present in this or any previous or subsequent implementations.
	 * @param participant Virtual (no address, only public key exist) address of participant to add.
	 * @param signature Participant identity payload signed by this same participant.
	 */
	function registerParticipant(address participant, bytes calldata signature) external {
		requireParticipantNotPresentRecursive(participant);

		IdentityPayload memory identityPayload = getIdentityPayload(participant);

		require(
			_recoverIdentitySigner(identityPayload, signature) == participant,
			'Invalid signer'
		);

		_participantData[participant] = ParticipantData({
			status: ParticipantStatus.Pending,
			nonce: identityPayload.nonce,
			registrationTime: uint64(block.timestamp)
		});

		emit ParticipantRegistered(participant);
	}

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
	// migrate participant
	// ======================

	// TODO: change dev docs
	/**
	 * @notice Migrate participant to the newest implementation present in upgrades chain. Emit `ParticipantMigratedFrom` and `ParticipantMigratedTo` events.
	 * @dev NextImplementation must have been set. Participant must not have been migrated.
	 * @param participant Address of participant to migrate.
	 * @param signature Participant identity payload signed by that participant.
	 */
	function migrateParticipant(address participant, bytes calldata signature) external {
		require(address(_nextImplementation) != address(0), 'Next implementation is not set');

		_requireParticipantPresent(participant);

		IdentityPayload memory identityPayload = getIdentityPayload(participant);

		require(
			_recoverIdentitySigner(identityPayload, signature) == participant,
			'Invalid signer'
		);

		// Get previous participant data
		ParticipantData memory currentData = _participantData[participant];
		require(currentData.status != ParticipantStatus.Migrated, 'Participant already migrated');

		// Update data to resemble migration
		ParticipantData memory updatedData = currentData;
		updatedData.nonce = identityPayload.nonce;

		// Get token amount to migrate
		uint256 migrateTokenAmount = _lockedBy[participant];

		// Get newest (right-most) Registry in upgradeability chain
		YellowRegistry newestRegistry = YellowRegistry(address(getRightmostImplementation()));

		_migrateParticipantDataTo(newestRegistry, participant, updatedData);

		_migrateLockedTokensTo(newestRegistry, participant, migrateTokenAmount);

		// Mark participant as migrated on this implementation
		_participantData[participant] = ParticipantData({
			status: ParticipantStatus.Migrated,
			nonce: updatedData.nonce,
			registrationTime: updatedData.registrationTime
		});

		// Emit event
		emit ParticipantMigratedFrom(participant, _self);
		emit LockedTokensMigratedFrom(participant, migrateTokenAmount, _self);
	}

	// ======================
	// internal functions
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

	/**
	 * @notice Recover signer of identity payload.
	 * @dev Recover signer of identity payload.
	 * @param identityPayload Identity payload that has been signed.
	 * @param signature Signed identity payload.
	 * @return address Address of the signer.
	 */
	function _recoverIdentitySigner(IdentityPayload memory identityPayload, bytes memory signature)
		internal
		pure
		returns (address)
	{
		return keccak256(abi.encode(identityPayload)).toEthSignedMessageHash().recover(signature);
	}

	// TODO: change dev docs
	/**
	 * @notice Recursively migrate participant data to newest implementation in upgrades chain. Emit `ParticipantMigratedTo` event.
	 * @dev Require PREVIOUS_IMPLEMENTATION_ROLE to invoke.
	 * @param participant Address of participant to migrate data of.
	 * @param data Participant data to migrate.
	 */
	function _migrateParticipantDataTo(
		YellowRegistry to,
		address participant,
		ParticipantData memory data
	) internal {
		to._migrateParticipantData(participant, data);

		emit ParticipantMigratedTo(participant, _self);
	}

	// TODO: change dev docs
	/**
	 * @notice Internal logic of migrating participant data. Can be overridden to change.
	 * @dev Internal logic of migrating participant data. Can be overridden to change.
	 * @param participant Address of participant to migrate data of.
	 * @param data Participant data to migrate.
	 */
	function _migrateParticipantData(address participant, ParticipantData memory data)
		public
		virtual
		onlyLeftImplementation(YellowClearingUpgradeability(msg.sender))
	{
		_participantData[participant] = data;
	}

	event ParticipantRegistered(address participant);

	event ParticipantStatusChanged(address indexed participant, ParticipantStatus indexed status);

	event ParticipantDataSet(address indexed participant, ParticipantData data);

	event ParticipantMigratedFrom(address indexed participant, address indexed from);

	event ParticipantMigratedTo(address indexed participant, address indexed to);
}

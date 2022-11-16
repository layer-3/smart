//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import './Upgradeability.sol';
import './Registry.sol';

/**
 * @dev Implementation for the YellowClearing. Version 1.0.
 */
contract YellowClearing is Upgradeability(Upgradeability(address(0))), Registry {
	// ======================
	// Register participant
	// ======================

	/**
	 * @notice Register participant by adding it to the registry with Pending status. Emit `ParticipantRegistered` event.
	 * @dev Participant must not be present in this or any previous or subsequent implementations.
	 * @param participant Virtual (no address, only public key exist) address of participant to add.
	 * @param signature Participant identity payload signed by this same participant.
	 */
	function registerParticipant(address participant, bytes calldata signature) external {
		requireParticipantNotPresentRecursive(participant);

		_identifyRequest(participant, signature);

		_participantData[participant] = ParticipantData({
			status: ParticipantStatus.Pending,
			registrationTime: uint64(block.timestamp)
		});

		emit ParticipantRegistered(participant);
	}

	// ======================
	// Migrate participant
	// ======================

	/**
	 * @notice Migrate participant to the newest implementation present in upgrades chain. Emit `ParticipantMigratedFrom` and `ParticipantMigratedTo` events.
	 * @dev NextImplementation must have been set. Participant must not have been migrated.
	 * @param participant Address of participant to migrate.
	 * @param signature Participant identity payload signed by that participant.
	 */
	function migrateParticipant(address participant, bytes calldata signature) external {
		require(address(nextImplementation) != address(0), 'Next implementation is not set');

		_requireParticipantPresent(participant);

		_identifyRequest(participant, signature);

		// Get previous participant data
		ParticipantData memory currentData = _participantData[participant];
		require(currentData.status != ParticipantStatus.Migrated, 'Participant already migrated');

		// Get token amount to migrate
		uint256 migrateTokenAmount = _lockedBy[participant];

		// Get newest (right-most) YellowClearing in upgradeability chain
		YellowClearing newestClearing = YellowClearing(address(getRightmostImplementation()));

		// Migrate data and tokens to the newest implementation
		_migrateParticipantDataTo(newestClearing, participant, currentData);
		_migrateLockedTokensTo(newestClearing, participant, migrateTokenAmount);

		// Emit event
		emit ParticipantMigratedFrom(participant, _self);
		emit LockedTokensMigratedFrom(participant, migrateTokenAmount, _self);
	}

	// ======================
	// Internal
	// ======================

	/**
	 * @notice Recursively migrate participant data to newest implementation in upgrades chain. Emit `ParticipantMigratedTo` event.
	 * @dev Require PREVIOUS_IMPLEMENTATION_ROLE to invoke.
	 * @param participant Address of participant to migrate data of.
	 * @param data Participant data to migrate.
	 */
	function _migrateParticipantDataTo(
		YellowClearing to,
		address participant,
		ParticipantData memory data
	) internal {
		_participantData[participant] = ParticipantData({
			status: ParticipantStatus.Migrated,
			registrationTime: data.registrationTime
		});

		to._migrateParticipantData(participant, data);
	}

	/**
	 * @notice Internal logic of migrating participant data. Can be overridden to change.
	 * @dev Internal logic of migrating participant data. Can be overridden to change.
	 * @param participant Address of participant to migrate data of.
	 * @param data Participant data to migrate.
	 */
	function _migrateParticipantData(address participant, ParticipantData memory data)
		public
		virtual
		onlyLeftImplementation(Upgradeability(msg.sender))
	{
		_participantData[participant] = data;

		emit ParticipantMigratedTo(participant, _self);
	}

	// ======================
	// Events
	// ======================

	event ParticipantRegistered(address participant);

	event ParticipantMigratedFrom(address indexed participant, address indexed from);

	event ParticipantMigratedTo(address indexed participant, address indexed to);
}

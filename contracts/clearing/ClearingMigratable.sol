//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import './ClearingChained.sol';
import './interfaces/IPrevImplementation.sol';

abstract contract ClearingMigratable is ClearingChained {
	// needed only to migrate from V1 to V2 (here)
	bytes32 public constant PREVIOUS_IMPLEMENTATION_ROLE =
		keccak256('PREVIOUS_IMPLEMENTATION_ROLE');

	constructor(IPrevImplementation prevImplementation) ClearingChained(prevImplementation) {}

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
		ClearingMigratable newestClearing = ClearingMigratable(
			address(getRightmostImplementation())
		);

		// Migrate data and tokens to the newest implementation
		_migrateParticipantDataTo(newestClearing, participant, currentData);
		_migrateLockedTokensTo(newestClearing, participant, migrateTokenAmount);

		// Emit event
		emit ParticipantMigratedFrom(participant, _self);
		emit LockedTokensMigratedFrom(participant, migrateTokenAmount, _self);
	}

	// Migrate from V1 to V2 (HERE)
	function migrateParticipantData(
		address participant,
		IPrevImplementation.ParticipantData memory data
	) external onlyRole(PREVIOUS_IMPLEMENTATION_ROLE) {
		// TODO:
	}

	// ======================
	// Internal migrate participant
	// ======================

	/**
	 * @notice Recursively migrate participant data to newest implementation in upgrades chain. Emit `ParticipantMigratedTo` event.
	 * @dev Require PREVIOUS_IMPLEMENTATION_ROLE to invoke.
	 * @param participant Address of participant to migrate data of.
	 * @param data Participant data to migrate.
	 */
	function _migrateParticipantDataTo(
		ClearingMigratable to,
		address participant,
		ParticipantData memory data
	) internal {
		_participantData[participant] = ParticipantData({
			status: ParticipantStatus.Migrated,
			registrationTime: data.registrationTime
		});

		to.migrateParticipantData(participant, data);
	}

	/**
	 * @notice Internal logic of migrating participant data. Can be overridden to change.
	 * @dev Internal logic of migrating participant data. Can be overridden to change.
	 * @param participant Address of participant to migrate data of.
	 * @param data Participant data to migrate.
	 */
	function migrateParticipantData(address participant, ParticipantData memory data)
		public
		virtual
		onlyLeftImplementation(Upgradeability(msg.sender))
	{
		_participantData[participant] = data;

		emit ParticipantMigratedTo(participant, _self);
	}

	// ======================
	// Internal migrate locked tokens
	// ======================

	function _migrateLockedTokensTo(
		ClearingMigratable to,
		address account,
		uint256 amount
	) internal {
		bool success = yellowToken.transfer(address(to), amount);
		require(success, 'Could not transfer Yellow token');

		to.migrateLockedTokens(account, amount);
	}

	function migrateLockedTokens(address account, uint256 amount)
		public
		virtual
		onlyLeftImplementation(Upgradeability(msg.sender))
	{
		_lockedBy[account] = amount;
		emit LockedTokensMigratedTo(account, amount, address(this));
	}

	// ======================
	// Events
	// ======================

	event ParticipantMigratedFrom(address indexed participant, address indexed from);

	event ParticipantMigratedTo(address indexed participant, address indexed to);
}

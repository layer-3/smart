//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

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

		_requireParticipantExists(participant);

		_identifyRequest(participant, signature);

		// Get previous participant data
		ParticipantData memory currentData = _getParticipantData(participant);
		require(currentData.status != Status.Migrated, 'Participant already migrated');

		// Get token amount to migrate
		uint256 migrateStackedTokenAmount = stackedBy[participant];
		uint256 migrateLockedTokenAmount = lockedBy[participant];

		// Get newest (right-most) YellowClearing in upgradeability chain
		ClearingMigratable newestClearing = ClearingMigratable(
			address(getRightmostImplementation())
		);

		// Migrate data and tokens to the newest implementation
		_migrateStackedTokensTo(newestClearing, participant, migrateStackedTokenAmount);
		_migrateLockedTokensTo(newestClearing, participant, migrateLockedTokenAmount);
		_migrateParticipantData(participant, currentData);

		// Emit event
		emit StackedTokensMigratedFrom(participant, migrateStackedTokenAmount, _self);
		emit LockedTokensMigratedFrom(participant, migrateLockedTokenAmount, _self);
		emit ParticipantMigratedFrom(participant, _self);
	}

	// Migrate from V1 to V2 (HERE)
	function migrateParticipantData(
		address participant,
		IPrevImplementation.ParticipantData memory prevData
	) public virtual onlyRole(PREVIOUS_IMPLEMENTATION_ROLE) {
		if (prevData.status == IPrevImplementation.Status.Pending) {
			statusOf[participant] = Status.Pending;
		} else if (
			prevData.status == IPrevImplementation.Status.Inactive ||
			prevData.status == IPrevImplementation.Status.Active
		) {
			statusOf[participant] = Status.Active;
		} else if (prevData.status == IPrevImplementation.Status.Suspended) {
			statusOf[participant] = Status.Suspended;
		} else {
			revert('Invalid previous implementation participant status');
		}

		registrationTimeOf[participant] = prevData.registrationTime;

		emit ParticipantMigratedTo(participant, address(this));
	}

	// ======================
	// Internal migrate participant
	// ======================

	function migrateParticipantDataConsequtive(
		address participant,
		IPrevImplementation.ParticipantData memory prevVersionData
	) public onlyPrevImplementation(Upgradeability(msg.sender)) {
		migrateParticipantData(participant, prevVersionData);

		if (address(nextImplementation) != address(0)) {
			nextImplementation.migrateParticipantDataConsequtive(
				participant,
				_getParticipantData(participant)
			);
		} else {
			emit ParticipantMigratedTo(participant, _self);
		}
	}

	/**
	 * @notice Recursively migrate participant data to newest implementation in upgrades chain. Emit `ParticipantMigratedTo` event.
	 * @dev Require PREVIOUS_IMPLEMENTATION_ROLE to invoke.
	 * @param participant Address of participant to migrate data of.
	 * @param data Participant data to migrate.
	 */
	// TODO: migrate associated addresses
	function _migrateParticipantData(address participant, ParticipantData memory data) internal {
		statusOf[participant] = Status.Migrated;

		_decrementParticipants();

		nextImplementation.migrateParticipantDataConsequtive(participant, data);
	}

	// ======================
	// Internal migrate tokens
	// ======================

	function _migrateStackedTokensTo(
		ClearingMigratable to,
		address account,
		uint256 amount
	) internal {
		stackedBy[account] -= amount;

		bool success = yellowToken.transfer(address(to), amount);
		require(success, 'Could not transfer Yellow token');

		to.migrateStackedTokens(account, amount);
	}

	// example code in the next implementation
	function migrateStackedTokens(address account, uint256 amount)
		public
		virtual
		onlyLeftImplementation(Upgradeability(msg.sender))
	{
		stackedBy[account] = amount;
		emit StackedTokensMigratedTo(account, amount, address(this));
	}

	function _migrateLockedTokensTo(
		ClearingMigratable to,
		address account,
		uint256 amount
	) internal {
		lockedBy[account] -= amount;

		to.migrateStackedTokens(account, amount);
	}

	// example code in the next implementation
	function migrateLockedTokens(address account, uint256 amount)
		public
		virtual
		onlyLeftImplementation(Upgradeability(msg.sender))
	{
		lockedBy[account] = amount;
		emit LockedTokensMigratedTo(account, amount, address(this));
	}

	function _migrateAssociatedAddresses(
		ClearingMigratable to,
		address account,
		address[] memory associatedAddresses
	) internal {
		to.migrateAssociatedAddresses(account, associatedAddresses);
	}

	// example code in the next implementation
	function migrateAssociatedAddresses(address account, address[] memory associatedAddresses)
		public
		virtual
		onlyLeftImplementation(Upgradeability(msg.sender))
	{
		associatedAddressesOf[account] = associatedAddresses;

		for (uint256 i = 0; i < associatedAddresses.length; i++) {
			associatedParticipantOf[associatedAddresses[i]] = account;
		}
	}

	// ======================
	// Events
	// ======================

	event ParticipantMigratedFrom(address indexed participant, address indexed from);

	event ParticipantMigratedTo(address indexed participant, address indexed to);

	event StackedTokensMigratedFrom(address indexed account, uint256 amount, address indexed from);

	event StackedTokensMigratedTo(address indexed account, uint256 amount, address indexed to);

	event LockedTokensMigratedFrom(address indexed account, uint256 amount, address indexed from);

	event LockedTokensMigratedTo(address indexed account, uint256 amount, address indexed to);
}

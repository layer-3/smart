//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import './Registry.sol';
import './Channel.sol';
import './Upgradeability.sol';
import './interfaces/IPrevImplementation.sol';

abstract contract ClearingChained is Registry, Channel, Upgradeability {
	constructor(IPrevImplementation prevImplementation) Upgradeability(prevImplementation) {}

	// ======================
	// Participant presence
	// ======================

	/**
	 * @notice Recursively check that participant is not present in this registry and all previous ones.
	 * @dev Recursively check that participant is not present in this registry and all previous ones.
	 * @param participant Address of participant to check.
	 */
	function requireParticipantNotPresentBackwards(address participant) public view {
		if (address(prevImplementation) != address(0)) {
			prevImplementation.requireParticipantNotPresentBackwards(participant);
		}

		_requireParticipantNotPresent(participant);
	}

	/**
	 * @notice Recursively check that participant is not present in this registry and all subsequent ones.
	 * @dev Recursively check that participant is not present in this registry and all subsequent ones.
	 * @param participant Address of participant to check.
	 */
	function requireParticipantNotPresentForwards(address participant) public view {
		if (address(nextImplementation) != address(0)) {
			nextImplementation.requireParticipantNotPresentForwards(participant);
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
	// Stacking
	// ======================

	function _requireEligibleForStacking(address participant) internal virtual override {
		_requireParticipantPresent(participant);
	}

	function _requireEligibleForUnstacking(
		address participant,
		bytes memory identifyPayloadSignature
	) internal virtual override {
		_identifyRequest(participant, identifyPayloadSignature);
	}

	// ======================
	// Events
	// ======================

	event ParticipantRegistered(address participant);
}

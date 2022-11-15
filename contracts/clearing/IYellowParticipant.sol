//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

interface IYellowParticipant {
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
		uint64 nonce;
		uint64 registrationTime;
	}

	// Participant identity payload
	struct IdentityPayload {
		address yellowRegistry;
		address participant;
		uint64 nonce;
	}
}

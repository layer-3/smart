//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

// todo: tidy
interface IPrevImplementation {
	enum Status {
		None,
		Pending,
		Inactive,
		Active,
		Suspended,
		Migrated
	}

	struct ParticipantData {
		Status status;
		uint64 nonce;
		uint64 registrationTime;
	}

	function hasParticipant(address participant) external view returns (bool);

	function getParticipantData(address participant) external view returns (ParticipantData memory);

	function setParticipantData(address participant, ParticipantData calldata data) external;

	function requireParticipantNotPresentBackwards(address participant) external view;

	function requireParticipantNotPresentForwards(address participant) external view;

	function requireParticipantNotPresentRecursive(address participant) external view;
}

//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import './Channel.sol';
import './App.sol';

interface IPreviousImplementation {
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
}

contract YellowClearing is Channel, App {
	struct ParticipantData {
		Status status;
		uint64 registrationTime;
		Status reinstateStatus;
		uint256 stackedYellowTokens;
	}

	bytes32 public constant NEXT_IMPLEMENTATION_ROLE = keccak256('NEXT_IMPLEMENTATION_ROLE');

	IPreviousImplementation public immutable previousImplementation;
	address public nextImplementation;

	constructor(
		IPreviousImplementation prevImpl,
		address yellowAdj,
		IERC20MetadataUpgradeable yellowTk
	) {
		previousImplementation = prevImpl;

		yellowAdjudicator = yellowAdj;
		yellowToken = yellowTk;

		_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

		_grantRole(REGISTRY_MODERATOR_ROLE, msg.sender);
		_grantRole(REGISTRY_VALIDATOR_ROLE, msg.sender);

		_grantRole(CHANNEL_ADJUDICATOR_ROLE, yellowAdj);
	}

	function setNextImplementation(address nextImpl) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(nextImplementation == address(0), 'next implementation is already set');

		require(nextImpl != address(0) && nextImpl != address(this), 'invalid next implementation');

		nextImplementation = nextImpl;

		_grantRole(NEXT_IMPLEMENTATION_ROLE, nextImplementation);

		emit NextImplementationSet(nextImplementation);
	}

	function getParticipantData(address participant)
		external
		view
		returns (ParticipantData memory)
	{
		return
			ParticipantData({
				status: status[participant],
				registrationTime: registrationTime[participant],
				reinstateStatus: reinstateStatus[participant],
				stackedYellowTokens: stackedYellowTokens[participant]
			});
	}

	function isParticipantRegistered(address participant) public view returns (bool) {
		return
			status[participant] != Status.None ||
			previousImplementation.hasParticipant(participant);
	}

	function registerParticipant(address participant, bytes calldata identityPayloadSignature)
		external
	{
		require(
			nextImplementation == address(0),
			'can not register participant on previous implementation'
		);

		require(!isParticipantRegistered(participant), 'participant is already registered');

		_identify(participant, identityPayloadSignature);

		status[participant] = Status.Pending;
		registrationTime[participant] = uint64(block.timestamp);

		emit ParticipantRegistered(participant);
	}

	function _migrateParticipantData(address participant) private {
		IPreviousImplementation.ParticipantData memory prevData = previousImplementation
			.getParticipantData(participant);

		if (prevData.status == IPreviousImplementation.Status.Pending) {
			status[participant] = Status.Pending;
		} else if (
			prevData.status == IPreviousImplementation.Status.Inactive ||
			prevData.status == IPreviousImplementation.Status.Active
		) {
			status[participant] = Status.Active;
		} else if (prevData.status == IPreviousImplementation.Status.Suspended) {
			status[participant] = Status.Suspended;
		} else {
			revert('invalid previous implementation participant status');
		}

		registrationTime[participant] = prevData.registrationTime;

		previousImplementation.setParticipantData(
			participant,
			IPreviousImplementation.ParticipantData({
				status: IPreviousImplementation.Status.Migrated,
				nonce: prevData.nonce,
				registrationTime: prevData.registrationTime
			})
		);

		emit ParticipantMigrated(participant);
	}

	function migrateParticipantData(address participant)
		external
		onlyRole(NEXT_IMPLEMENTATION_ROLE)
	{
		_migrateParticipantData(participant);
	}

	function migrateParticipant(address participant, bytes calldata identityPayloadSignature)
		external
	{
		require(
			previousImplementation.hasParticipant(participant),
			'participant is not registered on previous implementation'
		);

		require(status[participant] == Status.None, 'participant has already migrated');

		_identify(participant, identityPayloadSignature);

		_migrateParticipantData(participant);
	}

	function setParticipantMigrated(address participant)
		external
		onlyRole(NEXT_IMPLEMENTATION_ROLE)
	{
		status[participant] = Status.Migrated;

		emit ParticipantStatusChanged(participant, Status.Migrated);
	}

	event NextImplementationSet(address nextImplementation);

	event ParticipantRegistered(address indexed participant);

	event ParticipantMigrated(address indexed participant);
}

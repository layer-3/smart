//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '@openzeppelin/contracts/utils/Address.sol';

import './Channel.sol';
import './App.sol';

// NOTE: This contract is a placeholder for next version of YellowClearing contract.
// It is not used in the current version of the protocol.

// TODO: Update to match current version latest changes

interface IPreviousImplementation {
	enum Status {
		None,
		Pending,
		Active,
		Suspended,
		Migrated
	}

	struct ParticipantData {
		Status status;
		uint64 registrationTime;
		Status reinstateStatus;
		uint256 stackedYellowTokens;
	}

	function status(address participant) external view returns (Status);

	function isParticipantRegistered(address participant) external view returns (bool);

	function getParticipantData(address participant) external view returns (ParticipantData memory);

	function migrateParticipantData(address participant) external;

	function setParticipantMigrated(address participant) external;
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
			previousImplementation.isParticipantRegistered(participant);
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

		status[participant] = Status(uint8(prevData.status));
		registrationTime[participant] = prevData.registrationTime;
		reinstateStatus[participant] = Status(uint8(prevData.reinstateStatus));

		// TODO: other migrations (channel, stats, ...)

		previousImplementation.setParticipantMigrated(participant);

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
			previousImplementation.isParticipantRegistered(participant),
			'participant is not registered on previous implementations'
		);

		require(status[participant] == Status.None, 'participant has already migrated');

		if (previousImplementation.status(participant) == IPreviousImplementation.Status.None) {
			previousImplementation.migrateParticipantData(participant);
		}

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

//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/utils/Address.sol';

import '../v1/Upgradeability.sol';
import '../v1/Registry.sol';

// NOTE: This contract is a placeholder for next version of YellowClearing contract.
// It is not used in the current version of the protocol.

contract YellowClearing is Upgradeability, Registry {
	struct ParticipantData {
		Status status;
		uint64 registrationTime;
		Status reinstateStatus;
	}

	address public constant PREVIOUS_IMPLEMENTATION = 0x0000000000000000000000000000000000000000;

	constructor() {
		_setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

		_setupRole(UPGRADEABILITY_MAINTAINER_ROLE, msg.sender);

		_grantRole(REGISTRY_MODERATOR_ROLE, msg.sender);
		_grantRole(REGISTRY_VALIDATOR_ROLE, msg.sender);
	}

	function getParticipantData(address participant)
		external
		view
		returns (ParticipantData memory)
	{
		return
			ParticipantData({
				status: _status[participant],
				registrationTime: _registrationTime[participant],
				reinstateStatus: _reinstateStatus[participant]
			});
	}

	function _isParticipantRegisteredOnPreviousImplementations(address participant)
		private
		view
		returns (bool)
	{
		return
			abi.decode(
				Address.functionStaticCall(
					PREVIOUS_IMPLEMENTATION,
					abi.encodeWithSignature('isParticipantRegistered(address)', participant)
				),
				(bool)
			);
	}

	function isParticipantRegistered(address participant) public view returns (bool) {
		return
			hasParticipant(participant) ||
			_isParticipantRegisteredOnPreviousImplementations(participant);
	}

	function registerParticipant(address participant, bytes calldata identityPayloadSignature)
		external
	{
		require(
			_nextImplementation == address(0),
			'can not register participant on old implementation'
		);

		require(!isParticipantRegistered(participant), 'participant is already registered');

		_identify(participant, identityPayloadSignature);

		_status[participant] = Status.Pending;
		_registrationTime[participant] = uint64(block.timestamp);

		emit ParticipantRegistered(participant);
	}

	function _migrateParticipantData(address participant) private {
		(uint8 oldStatus, uint64 oldRegistrationTime, uint8 reinstateStatus) = abi.decode(
			Address.functionStaticCall(
				PREVIOUS_IMPLEMENTATION,
				abi.encodeWithSignature('getParticipantData(address)', participant)
			),
			(uint8, uint64, uint8)
		);

		_status[participant] = Status(oldStatus);
		_registrationTime[participant] = oldRegistrationTime;
		_reinstateStatus[participant] = Status(reinstateStatus);

		Address.functionDelegateCall(
			PREVIOUS_IMPLEMENTATION,
			abi.encodeWithSignature('setParticipantMigrated(address)', participant)
		);

		emit ParticipantMigrated(participant);
	}

	function migrateParticipantData(address participant) public onlyRole(NEXT_IMPLEMENTATION_ROLE) {
		_migrateParticipantData(participant);
	}

	function migrateParticipant(address participant, bytes calldata identityPayloadSignature)
		external
	{
		require(
			_isParticipantRegisteredOnPreviousImplementations(participant),
			'participant is not registered on previous implementations'
		);

		require(_status[participant] == Status.None, 'participant has already migrated');

		bool migratedToPreviousImplementation = abi.decode(
			Address.functionStaticCall(
				PREVIOUS_IMPLEMENTATION,
				abi.encodeWithSignature('hasParticipant(address)', participant)
			),
			(bool)
		);
		if (!migratedToPreviousImplementation) {
			Address.functionDelegateCall(
				PREVIOUS_IMPLEMENTATION,
				abi.encodeWithSignature('migrateParticipantData(address)', participant)
			);
		}

		_identify(participant, identityPayloadSignature);

		_migrateParticipantData(participant);
	}

	function setParticipantMigrated(address participant)
		external
		onlyRole(NEXT_IMPLEMENTATION_ROLE)
	{
		_status[participant] = Status.Migrated;
	}

	event ParticipantRegistered(address indexed participant);

	event ParticipantMigrated(address indexed participant);
}

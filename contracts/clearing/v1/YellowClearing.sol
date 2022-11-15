//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/utils/Address.sol';

import './Upgradeability.sol';
import './Registry.sol';

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

	function _isParticipantRegisteredOnPreviousImplementation(address participant)
		private
		view
		returns (bool)
	{
		return
			abi.decode(
				Address.functionStaticCall(
					PREVIOUS_IMPLEMENTATION,
					abi.encodeWithSignature('hasParticipant(address)', participant)
				),
				(bool)
			);
	}

	function isParticipantRegistered(address participant) public view returns (bool) {
		return
			hasParticipant(participant) ||
			_isParticipantRegisteredOnPreviousImplementation(participant);
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
		(uint8 oldStatus, uint64 oldNonce, uint64 oldRegistrationTime) = abi.decode(
			Address.functionStaticCall(
				PREVIOUS_IMPLEMENTATION,
				abi.encodeWithSignature('getParticipantData(address)', participant)
			),
			(uint8, uint64, uint64)
		);

		if (oldStatus == 1) {
			_status[participant] = Status.Pending;
		} else if (oldStatus == 2 || oldStatus == 3) {
			_status[participant] = Status.Active;
		} else if (oldStatus == 4) {
			_status[participant] = Status.Suspended;
		} else {
			revert('invalid previous implementation participant status');
		}

		_registrationTime[participant] = oldRegistrationTime;

		Address.functionDelegateCall(
			PREVIOUS_IMPLEMENTATION,
			abi.encodeWithSignature(
				'setParticipantData(address,tuple(uint8,uint64,uint64))',
				participant,
				abi.encodePacked(uint8(5), oldNonce, oldRegistrationTime)
			)
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
			_isParticipantRegisteredOnPreviousImplementation(participant),
			'participant is not registered on previous implementation'
		);

		require(_status[participant] == Status.None, 'participant has already migrated');

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

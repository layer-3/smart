//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '@openzeppelin/contracts/utils/Address.sol';

import './Upgradeability.sol';
import './Registry.sol';
import './Adjudicator.sol';
import './App.sol';

contract YellowClearing is Upgradeability, Registry, Adjudicator, App {
	struct ParticipantData {
		Status status;
		uint64 registrationTime;
		Status reinstateStatus;
	}

	address public immutable previousImplementation;

	constructor(address prevImpl) {
		previousImplementation = prevImpl;

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
				status: status[participant],
				registrationTime: registrationTime[participant],
				reinstateStatus: reinstateStatus[participant]
			});
	}

	function _isParticipantRegisteredOnPrevImpl(address participant) private view returns (bool) {
		return
			abi.decode(
				Address.functionStaticCall(
					previousImplementation,
					abi.encodeWithSignature('hasParticipant(address)', participant)
				),
				(bool)
			);
	}

	function isParticipantRegistered(address participant) public view returns (bool) {
		return
			status[participant] != Status.None || _isParticipantRegisteredOnPrevImpl(participant);
	}

	function registerParticipant(address participant, bytes calldata identityPayloadSignature)
		external
	{
		require(
			nextImplementation == address(0),
			'can not register participant on old implementation'
		);

		require(!isParticipantRegistered(participant), 'participant is already registered');

		_identify(participant, identityPayloadSignature);

		status[participant] = Status.Pending;
		registrationTime[participant] = uint64(block.timestamp);

		emit ParticipantRegistered(participant);
	}

	function _migrateParticipantData(address participant) private {
		(uint8 oldStatus, uint64 oldNonce, uint64 oldRegistrationTime) = abi.decode(
			Address.functionStaticCall(
				previousImplementation,
				abi.encodeWithSignature('getParticipantData(address)', participant)
			),
			(uint8, uint64, uint64)
		);

		if (oldStatus == 1) {
			status[participant] = Status.Pending;
		} else if (oldStatus == 2 || oldStatus == 3) {
			status[participant] = Status.Active;
		} else if (oldStatus == 4) {
			status[participant] = Status.Suspended;
		} else {
			revert('invalid previous implementation participant status');
		}

		registrationTime[participant] = oldRegistrationTime;

		Address.functionDelegateCall(
			previousImplementation,
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
			_isParticipantRegisteredOnPrevImpl(participant),
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
	}

	event ParticipantRegistered(address indexed participant);

	event ParticipantMigrated(address indexed participant);
}

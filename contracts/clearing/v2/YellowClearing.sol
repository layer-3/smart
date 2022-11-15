//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '@openzeppelin/contracts/utils/Address.sol';

import '../v1/Upgradeability.sol';
import '../v1/Registry.sol';
import '../v1/Adjudicator.sol';
import '../v1/App.sol';

// NOTE: This contract is a placeholder for next version of YellowClearing contract.
// It is not used in the current version of the protocol.

// TODO: Update to match v1 latest changes

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

	function _isParticipantRegisteredOnPrevImpls(address participant) private view returns (bool) {
		return
			abi.decode(
				Address.functionStaticCall(
					previousImplementation,
					abi.encodeWithSignature('isParticipantRegistered(address)', participant)
				),
				(bool)
			);
	}

	function isParticipantRegistered(address participant) public view returns (bool) {
		return
			status[participant] != Status.None || _isParticipantRegisteredOnPrevImpls(participant);
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
		(Status oldStatus, uint64 oldRegistrationTime, Status oldReinstateStatus) = abi.decode(
			Address.functionStaticCall(
				previousImplementation,
				abi.encodeWithSignature('getParticipantData(address)', participant)
			),
			(Status, uint64, Status)
		);

		status[participant] = oldStatus;
		registrationTime[participant] = oldRegistrationTime;
		reinstateStatus[participant] = oldReinstateStatus;

		Address.functionDelegateCall(
			previousImplementation,
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
			_isParticipantRegisteredOnPrevImpls(participant),
			'participant is not registered on previous implementations'
		);

		require(status[participant] == Status.None, 'participant has already migrated');

		Status prevImplStatus = abi.decode(
			Address.functionStaticCall(
				previousImplementation,
				abi.encodeWithSignature('status(address)', participant)
			),
			(Status)
		);
		if (prevImplStatus != Status.None) {
			Address.functionDelegateCall(
				previousImplementation,
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
		status[participant] = Status.Migrated;
	}

	event ParticipantRegistered(address indexed participant);

	event ParticipantMigrated(address indexed participant);
}

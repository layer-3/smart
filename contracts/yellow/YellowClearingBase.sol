//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import './IVault.sol';

abstract contract YellowClearingBase is AccessControl {
    using ECDSA for bytes32;

    // Participant status
    enum ParticipantStatus {
        // Participant is not registered
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
        uint64 registrationTime;
        ParticipantStatus status;
    }

    // Roles
    bytes32 public constant REGISTRY_MAINTAINER_ROLE = keccak256('REGISTRY_MAINTAINER_ROLE');
    bytes32 public constant REGISTRY_VALIDATOR_ROLE = keccak256('REGISTRY_VALIDATOR_ROLE');
    bytes32 public constant AUDITOR_ROLE = keccak256('AUDITOR_ROLE');
    bytes32 public constant PREVIOUS_IMPLEMENTATION_ROLE =
        keccak256('PREVIOUS_IMPLEMENTATION_ROLE');

    // Participant data mapping
    mapping(address => ParticipantData) internal _participantData;

    // Next implementation
    YellowClearingBase private _nextImplementation;

    // Address of this contract
    address private immutable _self = address(this);

    // Constructor
    constructor(YellowClearingBase previousImplementation) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRY_MAINTAINER_ROLE, msg.sender);

        if (address(previousImplementation) != address(0)) {
            _grantRole(PREVIOUS_IMPLEMENTATION_ROLE, address(previousImplementation));
        }
    }

    // Get next implementation address
    function getNextImplementation() external view returns (YellowClearingBase) {
        return _nextImplementation;
    }

    // Set next implementation address
    function setNextImplementation(YellowClearingBase nextImplementation)
        external
        onlyRole(REGISTRY_MAINTAINER_ROLE)
    {
        require(address(_nextImplementation) == address(0), 'Next implementation already set');
        require(
            address(nextImplementation) != address(0) && address(nextImplementation) != _self,
            'Invalid nextImplementation supplied'
        );

        require(
            nextImplementation.hasRole(PREVIOUS_IMPLEMENTATION_ROLE, address(this)),
            'Previous implementation role is required'
        );

        _nextImplementation = nextImplementation;

        emit NextImplementationSet(nextImplementation);
    }

    // Has participant
    function hasParticipant(address participant) public view returns (bool) {
        return _participantData[participant].status != ParticipantStatus.None;
    }

    // Recursively check that participant is not present in the registry
    function requireParticipantNotPresent(address participant) public view {
        if (address(_nextImplementation) != address(0)) {
            _nextImplementation.requireParticipantNotPresent(participant);
        }

        require(!hasParticipant(participant), 'Participant already registered');
    }

    // Get participant data
    function getParticipantData(address participant)
        external
        view
        returns (ParticipantData memory)
    {
        require(hasParticipant(participant), 'Participant does not exist');

        return _participantData[participant];
    }

    // Register participant with Pending status using signature by its Broker
    function registerParticipant(address participant, bytes calldata signature) external {
        requireParticipantNotPresent(participant);

        require(_recoverAddressSigner(participant, signature) == participant, 'Invalid signer');

        _participantData[participant] = ParticipantData({
            status: ParticipantStatus.Pending,
            registrationTime: uint64(block.timestamp)
        });

        emit ParticipantRegistered(participant);
    }

    // Validate participant by setting its status to Active or Inactive
    function validateParticipant(address participant) external onlyRole(REGISTRY_VALIDATOR_ROLE) {
        require(hasParticipant(participant), 'Participant does not exist');
        require(
            _participantData[participant].status == ParticipantStatus.Pending,
            'Invalid status'
        );

        // status changes to either Active or Inactive depending on internal logic yet to be added
        _participantData[participant].status = ParticipantStatus.Active;

        emit ParticipantStatusChanged(participant, ParticipantStatus.Active);
    }

    // Suspend participant by setting its status to Suspended
    function suspendParticipant(address participant) external onlyRole(AUDITOR_ROLE) {
        require(hasParticipant(participant), 'Participant does not exist');

        ParticipantStatus status = _participantData[participant].status;
        require(
            status != ParticipantStatus.None && status != ParticipantStatus.Migrated,
            'Invalid status'
        );

        _participantData[participant].status = ParticipantStatus.Suspended;

        emit ParticipantStatusChanged(participant, ParticipantStatus.Suspended);
    }

    // Reinstate participant by setting its status back to Active or Inactive
    function reinstateParticipant(address participant) external onlyRole(AUDITOR_ROLE) {
        require(hasParticipant(participant), 'Participant does not exist');
        require(
            _participantData[participant].status == ParticipantStatus.Suspended,
            'Invalid status'
        );

        // status changes to either Active or Inactive depending on internal logic yet to be added
        _participantData[participant].status = ParticipantStatus.Active;

        emit ParticipantStatusChanged(participant, ParticipantStatus.Active);
    }

    // Set participant data
    function setParticipantData(address participant, ParticipantData memory data)
        external
        onlyRole(REGISTRY_MAINTAINER_ROLE)
    {
        require(participant != address(0), 'Invalid participant address');

        require(
            _participantData[participant].status != ParticipantStatus.Migrated,
            'Participant already migrated'
        );

        _participantData[participant] = data;

        emit ParticipantDataSet(participant, data);
    }

    // Migrate participant
    function migrateParticipant(address participant, bytes calldata signature) external {
        require(address(_nextImplementation) != address(0), 'Next implementation is not set');

        require(_recoverAddressSigner(participant, signature) == participant, 'Invalid signer');

        require(hasParticipant(participant), 'Participant does not exist');

        // Get previous participant data
        ParticipantData memory currentData = _participantData[participant];
        require(currentData.status != ParticipantStatus.Migrated, 'Participant already migrated');

        // Migrate data, emit ParticipantMigratedTo
        _nextImplementation.migrateParticipantData(participant, currentData);

        // Emit event
        emit ParticipantMigratedFrom(participant, _self);

        // Mark participant as migrated on this implementation
        _participantData[participant] = ParticipantData({
            status: ParticipantStatus.Migrated,
            registrationTime: currentData.registrationTime
        });
    }

    // Migrate participant data on either this or next implementation
    function migrateParticipantData(address participant, ParticipantData memory data)
        external
        onlyRole(PREVIOUS_IMPLEMENTATION_ROLE)
    {
        if (address(_nextImplementation) != address(0)) {
            _nextImplementation.migrateParticipantData(participant, data);
        } else {
            _migrateParticipantData(participant, data);

            emit ParticipantMigratedTo(participant, _self);
        }
    }

    // Recover signer from `signature` provided `_address` is signed.
    function _recoverAddressSigner(address _address, bytes memory signature)
        internal
        pure
        returns (address)
    {
        return keccak256(abi.encode(_address)).toEthSignedMessageHash().recover(signature);
    }

    // Internal migrate logic. Can be overriden.
    function _migrateParticipantData(address participant, ParticipantData memory data)
        internal
        virtual
    {
        _participantData[participant] = data;
    }

    event NextImplementationSet(YellowClearingBase nextImplementation);

    event ParticipantRegistered(address participant);

    event ParticipantStatusChanged(address indexed participant, ParticipantStatus indexed status);

    event ParticipantDataSet(address indexed participant, ParticipantData data);

    event ParticipantMigratedFrom(address indexed participant, address indexed from);

    event ParticipantMigratedTo(address indexed participant, address indexed to);
}

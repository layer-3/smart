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
        // Participant is registered but not active
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
        IVault vault;
        uint256 registrationBlock;
    }

    // Data required to register a participant
    struct ParticipantRegisterData {
        IVault vault;
        bytes vaultBrokerSignature;
    }

    // Roles
    bytes32 public constant REGISTRY_MAINTAINER_ROLE = keccak256('REGISTRY_MAINTAINER_ROLE');
    bytes32 public constant PREVIOUS_IMPLEMENTATION_ROLE =
        keccak256('PREVIOUS_IMPLEMENTATION_ROLE');

    // Participant data mapping
    mapping(address => ParticipantData) private _participantData;

    // Next implementation
    YellowClearingBase private _nextImplementation;

    // Address of this contract
    address private immutable _self = address(this);

    // Constructor
    constructor(YellowClearingBase previousImplementation) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRY_MAINTAINER_ROLE, msg.sender);

        // Review: introduce a helper `isValidAddress(address)` method
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
            'Previous implementation role is absent'
        );

        _nextImplementation = nextImplementation;

        emit NextImplementationSet(nextImplementation);
    }

    // Has participant
    function hasParticipant(address participant) public view returns (bool) {
        return _participantData[participant].status != ParticipantStatus.None;
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

    // Recursively check that participant is not present in the registry
    function requireParticipantNotRegistered(address participant) public view {
        if (address(_nextImplementation) != address(0)) {
            _nextImplementation.requireParticipantNotRegistered(participant);
        }

        require(!hasParticipant(participant), 'Participant already registered');
    }

    // Register participant with Pending status using signature by its Broker
    function registerParticipant(address participant, ParticipantRegisterData calldata rData)
        external
    {
        requireParticipantNotRegistered(participant);

        require(
            keccak256(abi.encode(participant)).toEthSignedMessageHash().recover(
                rData.vaultBrokerSignature
            ) == rData.vault.getBrokerAddress(),
            'Signer is not participant vault broker'
        );

        _participantData[participant] = ParticipantData(
            ParticipantStatus.Pending,
            rData.vault,
            block.number
        );

        emit ParticipantRegistered(participant);
    }

    // Set participant data
    function setParticipantData(address participant, ParticipantData memory data)
        external
        onlyRole(REGISTRY_MAINTAINER_ROLE)
    {
        require(participant != address(0), 'Invalid participant address');

        require(
            _participantData[participant].status != ParticipantStatus.Migrated,
            'Participant migrated'
        );

        _participantData[participant] = data;

        emit ParticipantDataSet(participant, data);
    }

    // Migrate participant
    function migrateParticipant() external {
        require(address(_nextImplementation) != address(0), 'Next version is not set');

        address participant = msg.sender;

        require(hasParticipant(participant), 'Participant does not exist');

        // Get previous participant data
        ParticipantData memory currentData = _participantData[participant];
        require(currentData.status != ParticipantStatus.Migrated, 'Participant already migrated');

        // Migrate data
        _nextImplementation.migrateParticipantData(participant, currentData);

        // Mark participant as migrated on this implementation
        _participantData[participant] = ParticipantData({
            status: ParticipantStatus.Migrated,
            vault: currentData.vault,
            registrationBlock: currentData.registrationBlock
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

            emit ParticipantMigrated(participant, _self);
        }
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

    event ParticipantDataSet(address indexed participant, ParticipantData data);

    event ParticipantMigrated(address indexed participant, address indexed toAddress);
}

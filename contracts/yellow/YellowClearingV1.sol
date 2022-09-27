//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/access/AccessControl.sol';

// TODO: Share a common base and use `bytes` to represent arbitrary version specific data
// This allow to share Status and Data strucs, plus get/set methods and migration logic

abstract contract YellowClearingRegistryV1 {
    //
}

abstract contract YellowClearingLockingV1 {
    //
}

contract YellowClearingV1 is AccessControl {
    enum ParticipantStatus {
        None,
        Pending,
        Inactive,
        Active,
        Suspended,
        Migrated
    }

    enum ParticipantFlags {
        None
        // TODO: add flags
    }

    struct ParticipantData {
        ParticipantStatus status;
        // uint64 flags;
        bytes data;
    }

    // REGISTRY_MAINTAINER_ROLE
    bytes32 public constant REGISTRY_MAINTAINER_ROLE = keccak256('REGISTRY_MAINTAINER_ROLE');

    // Participant data
    mapping(address => ParticipantData) private _participantData;

    // Constructor
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
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
    }
}

contract YellowClearingV2 is AccessControl {
    enum ParticipantFlags {
        None
        // TODO: add flags
    }

    struct ParticipantData {
        YellowClearingV1.ParticipantStatus status;
        uint64 flags;
    }

    // REGISTRY_MAINTAINER_ROLE
    bytes32 public constant REGISTRY_MAINTAINER_ROLE = keccak256('REGISTRY_MAINTAINER_ROLE');

    // Previous version
    YellowClearingV1 private constant _PREVIOUS_VERSION =
        YellowClearingV1(0x0000000000000000000000000000000000000000);

    // Participant data
    mapping(address => ParticipantData) private _participantData;

    // Constructor
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // Has participant
    function hasParticipant(address participant) public view returns (bool) {
        return _participantData[participant].status != YellowClearingV1.ParticipantStatus.None;
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

    // Set participant data
    function setParticipantData(address participant, ParticipantData memory data)
        external
        onlyRole(REGISTRY_MAINTAINER_ROLE)
    {
        require(participant != address(0), 'Invalid participant address');

        _participantData[participant] = data;
    }

    // Migrate participant
    function migrateParticipant() external {
        address participant = msg.sender;

        require(_PREVIOUS_VERSION.hasParticipant(participant), 'Participant does not exist');

        // Get previous participant data
        YellowClearingV1.ParticipantData memory previousData = _PREVIOUS_VERSION.getParticipantData(
            participant
        );

        require(
            previousData.status != YellowClearingV1.ParticipantStatus.Migrated,
            'Participant already migrated'
        );

        // Migrate data
        _participantData[participant] = ParticipantData({
            status: previousData.status,
            flags: previousData.flags
        });

        // Update previous participant data
        _PREVIOUS_VERSION.setParticipantData(
            participant,
            YellowClearingV1.ParticipantData({
                status: YellowClearingV1.ParticipantStatus.Migrated,
                flags: previousData.flags
            })
        );
    }

    function lockTokens(address participant, uint256 amount) external {
        //
    }
}

// V3

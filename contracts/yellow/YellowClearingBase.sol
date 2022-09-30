//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/access/AccessControl.sol';

abstract contract YellowClearingBase is AccessControl {
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
        // Participant is registered but have migrated to a new version
        Migrated
    }

    // Participant data
    struct ParticipantData {
        ParticipantStatus status;
        bytes data;
    }

    // REGISTRY_MAINTAINER_ROLE
    bytes32 public constant REGISTRY_MAINTAINER_ROLE = keccak256('REGISTRY_MAINTAINER_ROLE');

    // Participant data mapping
    mapping(address => ParticipantData) private _participantData;

    // Previous version
    YellowClearingBase private _previousVersion;

    // Constructor
    constructor(YellowClearingBase previousVersion) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRY_MAINTAINER_ROLE, msg.sender);

        _previousVersion = previousVersion;
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

        emit ParticipantDataSet(participant, data);
    }

    // Migrate participant
    function migrateParticipant() external {
        address participant = msg.sender;

        require(_previousVersion.hasParticipant(participant), 'Participant does not exist');

        // Get previous participant data
        ParticipantData memory previousData = _previousVersion.getParticipantData(participant);

        require(previousData.status != ParticipantStatus.Migrated, 'Participant already migrated');

        // Migrate data
        _participantData[participant] = previousData;

        // Mark participant as migrated on previous version
        _previousVersion.setParticipantData(
            participant,
            ParticipantData({status: ParticipantStatus.Migrated, data: previousData.data})
        );

        emit ParticipantMigrated(participant);
    }

    event ParticipantDataSet(address indexed participant, ParticipantData data);

    event ParticipantMigrated(address indexed participant);
}

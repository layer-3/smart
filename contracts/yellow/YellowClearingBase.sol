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

    // Roles
    bytes32 public constant MAINTAINER_ROLE = keccak256('MAINTAINER_ROLE');
    bytes32 public constant PREVIOUS_VERSION_ROLE = keccak256('PREVIOUS_VERSION_ROLE');

    // Participant data mapping
    mapping(address => ParticipantData) private _participantData;

    // This version
    uint8 immutable version;

    // Next version
    YellowClearingBase private _nextVersion;

    // Constructor
    constructor(uint8 version_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MAINTAINER_ROLE, msg.sender);
        version = version_;
    }

    // Get next version address
    function getNextVersion() external view returns (YellowClearingBase) {
        return _nextVersion;
    }

    // Set next version address
    function setNextVersion(YellowClearingBase nextVersion) external onlyRole(MAINTAINER_ROLE) {
        require(nextVersion.hasRole(PREVIOUS_VERSION_ROLE, address(this)), 'Previous version role is absent');

        _nextVersion = nextVersion;
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
        onlyRole(MAINTAINER_ROLE)
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

        require(hasParticipant(participant), 'Participant does not exist'); 

        // Get previous participant data
        ParticipantData memory currentData = _participantData[participant];
        require(currentData.status != ParticipantStatus.Migrated, 'Participant already migrated');

        // Migrate data
        _nextVersion.migrateParticipantData(participant, currentData);

        // Mark participant as migrated on this version
        _participantData[participant] = ParticipantData({status: ParticipantStatus.Migrated, data: currentData.data});
    }

    // Migrate participant data on either this or next version
    function migrateParticipantData(address participant, ParticipantData memory data) external onlyRole(PREVIOUS_VERSION_ROLE) {
        if (address(_nextVersion) != address(0)) {
            _nextVersion.migrateParticipantData(participant, data);
        } else {
            _participantData[participant] = data;

            emit ParticipantMigrated(participant, version);
        }
    }

    event ParticipantDataSet(address indexed participant, ParticipantData data);

    event ParticipantMigrated(address indexed participant, uint8 indexed toVersion);
}

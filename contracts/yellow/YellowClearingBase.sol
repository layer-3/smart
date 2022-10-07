//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import './IVault.sol';

/**
 * @notice Base contract for Yellow Clearing. Responsible for all operations regarding Yellow Network.
 * @dev The actual implementation must derive from YellowClearingBase and can override `_migrateParticipantData` function.
 */
abstract contract YellowClearingBase is AccessControl {
    using ECDSA for bytes32;

    // Participant status
    enum ParticipantStatus {
        // Participant is not registered or have been removed
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

    /**
     * @notice Grant DEFAULT_ADMIN_ROLE and REGISTRY_MAINTAINER_ROLE roles to deployer, link previous implementation it supplied.
     *
     */
    constructor(YellowClearingBase previousImplementation) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRY_MAINTAINER_ROLE, msg.sender);

        if (address(previousImplementation) != address(0)) {
            _grantRole(PREVIOUS_IMPLEMENTATION_ROLE, address(previousImplementation));
        }
    }

    // ======================
    // Next Implementation
    // ======================

    /**
     * @notice Get next implementation address if set, zero address if not.
     * @dev Get next implementation address if set, zero address if not.
     * @return YellowClearingBase Next implementation address if set, zero address if not.
     */
    function getNextImplementation() external view returns (YellowClearingBase) {
        return _nextImplementation;
    }

    /**
     * @notice Set next implementation address. Must not be zero address or self. Emit `NextImplementationSet` event.
     * @dev Require REGISTRY_MAINTAINER_ROLE to be invoked. Require next implementation not to be already set. Require supplied next implementation contract to have granted this contract PREVIOUS_IMPLEMENTATION_ROLE.
     * @param nextImplementation Next implementation address.
     */
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

    // ======================
    // participant checks
    // ======================

    /**
     * @notice Check if participant is present in the registry. Participant is not present if it is not stored in the mapping or has `ParticipantStatus.None`.
     * @dev Check if participant is present in the registry. Participant is not present if it is not stored in the mapping or has `ParticipantStatus.None`.
     * @return True if participant is present, false otherwise.
     */
    function hasParticipant(address participant) public view returns (bool) {
        return _participantData[participant].status != ParticipantStatus.None;
    }

    /**
     * @notice Recursively check that participant is not present in this registry and any subsequent.
     * @dev Recursively check that participant is not present in this registry and all subsequent.
     * @param participant Address of participant to check.
     */
    function requireParticipantNotPresent(address participant) public view {
        if (address(_nextImplementation) != address(0)) {
            _nextImplementation.requireParticipantNotPresent(participant);
        }

        require(!hasParticipant(participant), 'Participant already registered');
    }

    /**
     * @notice Get participant data stored in the registry. Revert if participant is not present.
     * @dev Get participant data stored in the registry. Revert if participant is not present.
     * @param participant Address of participant to get data about.
     * @return ParticipantData Participant data.
     */
    function getParticipantData(address participant)
        external
        view
        returns (ParticipantData memory)
    {
        require(hasParticipant(participant), 'Participant does not exist');

        return _participantData[participant];
    }

    // ======================
    // participant changes
    // ======================

    /**
     * @notice Register participant by adding it to the registry with Pending status. Emit `ParticipantRegistered` event.
     * @dev Participant must not be present in this or any subsequent implementations.
     * @param participant Virtual (no address, only public key exist) address of participant to add.
     * @param signature Participant virtual address signer by this same participant.
     */
    function registerParticipant(address participant, bytes calldata signature) external {
        requireParticipantNotPresent(participant);

        require(_recoverAddressSigner(participant, signature) == participant, 'Invalid signer');

        _participantData[participant] = ParticipantData({
            status: ParticipantStatus.Pending,
            registrationTime: uint64(block.timestamp)
        });

        emit ParticipantRegistered(participant);
    }

    // REVIEW: change docs comment after checks are added
    /**
     * @notice Validate participant and, depending on checks to be added, set their status to either Active or Inactive. Emit `ParticipantStatusChanged` event.
     * @dev Require REGISTRY_VALIDATOR_ROLE to invoke. Participant must be present with Pending status.
     * @param participant Address of participant to validate.
     */
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

    // REVIEW: change docs comment after checks are added
    /**
     * @notice Suspend participantand set their status to Suspended. Emit `ParticipantStatusChanged` event.
     * @dev Require AUDITOR_ROLE to invoke. Participant must be present and not migrated
     * @param participant Address of participant to suspend.
     */
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

    // REVIEW: change docs comment after checks are added
    /**
     * @notice Reinstate participant and, depending on checks to be added, set their status to either Active or Inactive. Emit `ParticipantStatusChanged` event.
     * @dev Require AUDITOR_ROLE to invoke. Participant must have been suspended previously.
     * @param participant Address of participant to reinstate.
     */
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

    /**
     * @notice Set participiant data to data supplied. Emit `ParticipantDataChanged` event.
     * @dev Require REGISTRY_MAINTAINER_ROLE to invoke. Participant must not have been migrated.
     * @param participant Address of participant to set data of.
     * @param data Data to set.
     */
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

    // ======================
    // migrate participant
    // ======================

    /**
     * @notice Migrate participant to the newest implementation present in upgrades chain. Emit `ParticipantMigratedFrom` and `ParticipantMigratedTo` events.
     * @dev NextImplementation must have been set. Participant must not have been migrated.
     * @param participant Address of participant to migrate.
     * @param signature Participant address signed by that participant.
     */
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

    /**
     * @notice Recursively migrate participant data to newest implementation in upgrades chain. Emit `ParticipantMigratedTo` event.
     * @dev Require PREVIOUS_IMPLEMENTATION_ROLE to invoke.
     * @param participant Address of participant to migrate data of.
     * @param data Participant data to migrate.
     */
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

    // ======================
    // internal functions
    // ======================

    // Recover signer from `signature` provided `_address` is signed.
    /**
     * @notice Recover signer of the address.
     * @dev Recover signer of the address.
     * @param _address Address to be signed.
     * @param signature Signed address.
     * @return address Address of the signer.
     */
    function _recoverAddressSigner(address _address, bytes memory signature)
        internal
        pure
        returns (address)
    {
        return keccak256(abi.encode(_address)).toEthSignedMessageHash().recover(signature);
    }

    /**
     * @notice Internal logic of migrating participant data. Can be overriden to change.
     * @dev Internal logic of migrating participant data. Can be overriden to change.
     * @param participant Address of participant to migrate data of.
     * @param data Participant data to migrate.
     */
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

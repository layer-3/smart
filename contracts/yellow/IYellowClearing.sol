//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ExitFormat as Outcome } from '@statechannels/exit-format/contracts/ExitFormat.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/IAccessControl.sol';

/**
 * @notice Defines an interface for YellowClearing contract, which contains all logic related to Yellow Network, except state channels adjudication.
 */
interface IYellowClearing is IERC20, IAccessControl {
  // =================
  // External links
  // =================

  // address private YellowStorage;

  // =================
  // Version registry
  // =================
  
  // bytes32 public constant VERSIONER_ROLE = keccak256("VERSIONER_ROLE");

  struct ProtocolVersion {
    uint8 major;
    uint8 minor;
    uint8 patch;
  }

  // ProtocolVersion private _version;

  /**
   * @notice Get the currect natspec version of this contract.
   * @dev Get the currect natspec version of this contract.
   * @return uint8 major version part.
   * @return uint8 minor version part.
   * @return uint8 patch version part.
   */
  function version() external pure returns(uint8, uint8, uint8);

  struct ProtocolContract {
    string _name;
    address _address;
  }

  // string[] public _protocolVersions;

  // string[] public _protocolContracts;

  // mapping(string => ProtocolContract[]) public _contractOfVersion;

  /**
   * @notice Add a natspec version to a list of supported ones.
   * @notice Require VERSIONER_ROLE to invoke. Require the version not to be present.
   * @param major version part.
   * @param minor version part.
   * @param patch version part.
   */
  function addVersion(uint8 major, uint8 minor, uint8 patch) external; // onlyRole(VERSIONER_ROLE)

  /**
   * @notice Remove a natspec version from a list of supported ones.
   * @notice Require VERSIONER_ROLE to invoke. Require the version to be present. Removes all stored contracts at that version from the storage.
   * @param major version part.
   * @param minor version part.
   * @param patch version part.
   */
  function removeVersion(uint8 major, uint8 minor, uint8 patch) external; // onlyRole(VERSIONER_ROLE)

  /**
   * @notice Add a contract to the list of supported ones.
   * @dev Require VERSIONER_ROLE to invoke. Require `contractName` not to be present.
   * @param contractName Name of the contract to add.
   */
  function addContract(string calldata contractName) external; // onlyRole(VERSIONER_ROLE)

  /**
   * @notice Remove a contract from the list of supported ones.
   * @dev Require VERSIONER_ROLE to invoke. Require `contractName` to be present. Removes all stored contract with `contractName` from the storage.
   * @param contractName Name of the contract to remove.
   */
  function removeContract(string calldata contractName) external; // onlyRole(VERSIONER_ROLE)

  /**
   * @notice Add a contract at version to the registry.
   * @dev Require VERSIONER_ROLE to invoke. Require `contractName` to be supported. Require a version to be supported. Require `contractName` not to be already supported at a version supplied.
   * @param contractName Name of the contract to add.
   * @param contractAddress Address of the contract to add.
   * @param major version part.
   * @param minor version part.
   * @param patch version part.
   */
  function addContractAtVersion(
    string calldata contractName,
    address contractAddress,
    uint8 major,
    uint8 minor,
    uint8 patch
  ) external; // onlyRole(VERSIONER_ROLE)
  
  /**
   * @notice Edit the address of a contract at version in the registry.
   * @dev Require VERSIONER_ROLE to invoke. Require `contractName` to be already supported at a version supplied.
   * @param contractName Name of the contract to edit.
   * @param changedAddress Changed address of the contract.
   * @param major version part.
   * @param minor version part.
   * @param patch version part.
   */
  function editContractAtVersion(
    string calldata contractName,
    address changedAddress,
    uint8 major,
    uint8 minor,
    uint8 patch
  ) external; // onlyRole(VERSIONER_ROLE)

  /**
   * @notice Remove a contract at version from the registry.
   * @dev Require VERSIONER_ROLE to invoke. Require `contractName` to be already supported at a version supplied.
   * @param contractName Name of the contract to remove.
   * @param major version part.
   * @param minor version part.
   * @param patch version part.
   */
  function removeContractAtVersion(
    string calldata contractName,
    uint8 major,
    uint8 minor,
    uint8 patch
  ) external; // onlyRole(VERSIONER_ROLE)

  /**
   * @notice Get latest supported version in the registry.
   * @dev Require any version to be supported.
   * @return uint8 major version part.
   * @return uint8 minor version part.
   * @return uint8 patch version part.
   */
  function latestVersion() external view returns(uint8, uint8, uint8);

  /**
   * @notice Get all contracts at a version specified.
   * @dev Require a version to be supported.
   * @return ProtocolContract Array of supported contract names and addresses at a version specified.
   */
  function getAllContractAt(uint8 major, uint8 minor, uint8 patch) external view returns(ProtocolContract[] memory);

  /**
   * @notice Get all contracts at a latest version.
   * @dev Require any version to be supported.
   * @return ProtocolContract Array of latest supported contract names and addresses.
   */
  function getAllLatestContracts() external view returns(ProtocolContract[] memory);

  /**
   * @notice Get address of `contractName` at a version specified.
   * @dev Require a version to be suppored. Require `contractName` to be supported. Require `contractName` to be supported at version.
   * @param contractName Name of the contract to get address of.
   * @param major version part.
   * @param minor version part.
   * @param patch version part.
   * @return ProtocolContract Contract name and address.
   */
  function getContractAt(
    string calldata contractName,
    uint8 major,
    uint8 minor,
    uint8 patch
  ) external view returns(ProtocolContract memory);

  /**
   * @notice Get address of `contractName` at the latest version.
   * @dev Require any version to be present. Require `contractName` to be supported at version.
   * @param contractName Name of the contract to get address of.
   * @return ProtocolContract Contract name and address.
   */
  function getLatestContract(string calldata contractName) external view returns(ProtocolContract memory);

  // Decision on whether to put channels-related method into YellowClearing or to left them at NitroAdjudicator is yet to be made

  // // =================
  // // State channels
  // // =================

  // bytes32 public constant ADJUDICATOR_ROLE = keccak256("ADJUDICATOR_ROLE");

  // function fundChannel(address node, uint256 collateral) external;
  
  // function concludeChannel(address node) external;

  // function checkpointChannel(address node) external;

  // function challengeChannel(address node) external;


  // =================
  // Entity Registry
  // =================

  // bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

  // to describe and identify YN Nodes
  struct NodeInfo {
    // hash of the first domain
    bytes32 _id;

    // any number of labels can be added
    // abi.encode(mapping(string => string))
    bytes _encodedLabels;
  }
  
  enum RegistryChangeType {
    REGISTRY_ADD,
    REGISTRY_MODIFY,
    REGISTRY_REMOVE
  }

  struct RegistryChange {
    uint8 _changeType;
    NodeInfo _info;
  }

  // Latest snapshot id
  // uint256 private _latestSid;

  // mapping(uint256 => RegistryChange[]) private _entityRegistry;

  // RegistryChange[] private _pendingShapshot;

  event RegistryUpdated(uint256 newSid);

  /**
   * @notice Get latest snapshot id for the node to fetch only needed data.
   * @dev Get latest snapshot id for the node to fetch only needed data.
   * @return uint256 Id of the latest snapshot.
   */
  function lastSnapshot() external view returns(uint256);

  /**
   * @notice Fetch all node registry.
   * @dev It is more optimal to fetch only the unseed part of the registry using `fetchRegistry` method.
   * @return RegistryChange Array of struct describing registry changes.
   */
  function fetchAllRegistry() external returns(RegistryChange[] memory);

  /**
   * @notice Fetch changes to the registry since `startSid`.
   * @dev This method is more optimal to use in case a node already possesses a part of the registry.
   * @return RegistryChange Array of struct describing registry changes.
   */
  function fetchRegistry(uint256 startSid) external returns(RegistryChange[] memory);

  /**
   * @notice Create a pending snapshot to add registry changes to.
   * @dev Require REGISTRAR_ROLE to invoke. Require pending snapshot to be empty.
   */
  function createSnapshot() external; // onlyRole(REGISTRAR_ROLE)

  /**
   * @notice Add a registry change to the pending snapshot.
   * @dev Require REGISTRAR_ROLE to invoke.
   * @param registryChange A struct describing a change to the registry.
   */
  function addToSnapshot(RegistryChange calldata registryChange) external; // onlyRole(REGISTRAR_ROLE)

  /**
   * @notice Dump all changes from pending snapshot.
   * @dev Require REGISTRAR_ROLE to invoke. Require pending snapshot not to be empty.
   */
  function dumpPendingSnapshot() external; // onlyRole(REGISTRAR_ROLE)

  /**
   * @notice Finalize snapshot, add it to the mapping of snapshots, dumps it and increment latest snapshot id. Emits `RegistryUpdated` event with added snapshot id.
   * @dev Require REGISTRAR_ROLE to invoke. Require pending shapshot not to be empty.
   */
  function finalizeSnapshot() external; // onlyRole(REGISTRAR_ROLE)
                                        // emit RegistryUpdated(newSid)
  
  // =================
  // Clearing App
  // =================

  struct FixedPart {
    uint256 chainId;
    address[] participants;
    uint48 channelNonce;
    address appDefinition;
    uint48 challengeDuration;
  }

  struct VariablePart {
    Outcome.SingleAssetExit[] outcome;
    bytes appData;
    uint48 turnNum;
    bool isFinal;
  }

  struct RecoveredVariablePart {
    VariablePart variablePart;
    uint256 signedBy; // bitmask
  }

  /**
    * @notice Encodes application-specific rules for a particular ForceMove-compliant state channel.
    * @dev Encodes application-specific rules for a particular ForceMove-compliant state channel.
    * @param proof Array of recovered variable parts which constitutes a support proof for the candidate.
    * @param candidate Recovered variable part the proof was supplied for.
    */
  function requireStateSupported(
    FixedPart calldata fixedPart,
    RecoveredVariablePart[] calldata proof,
    RecoveredVariablePart calldata candidate
  ) external pure;
}

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ExitFormat as Outcome } from '@statechannels/exit-format/contracts/ExitFormat.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/IAccessControl.sol';

/**
 * @notice Defines an interface for YellowImpl contract, which contains all logic related to Yellow Network, except state channels adjudication.
 */
interface IYellowInterface is IERC20, IAccessControl {
  // =================
  // Versioning
  // =================
  
  bytes32 public constant VERSIONER_ROLE = keccak256("VERSIONER_ROLE");

  struct ProtocolVersion {
    uint8 major;
    uint8 minor;
    uint8 patch;
  }

  ProtocolVersion private _version;

  /**
   * @notice Get the currect natspec version of the YellowImpl contract.
   * @dev Get the currect natspec version of the YellowImpl contract.
   * @return major version part.
   * @return minor version part.
   * @return patch version part.
   */
  function version() external pure returns(uint8 major, uint8 minor, uint8 patch);

  /**
   * @notice Set the current natspec version of the YellowImpl contract.
   * @notice Require VERSIONER_ROLE to invoke.
   * @param major version part.
   * @param minor version part.
   * @param patch version part.
   */
  function setVersion(uint8 major, uint8 minor, uint8 patch) external; // onlyRole(VERSIONER_ROLE)

  // =================
  // ERC20
  // =================

  mapping(address => uint256) private _balances;
  mapping(address => mapping(address => uint256)) private _allowances;

  uint256 private _totalSupply;

  string private _name;
  string private _symbol;
  
  // =================
  // Locking
  // =================

  mapping(address => uint256) _lockedBy;

  /**
   * @notice Lock amount of Yellow tokens for the caller.
   * @dev Require sufficient Yellow token balance.
   * @param amount of Yellow tokens to be locked.
   */
  function lock(uint256 amount) external;
  
  /**
   * @notice Unlock amount of Yellow tokens for the caller.
   * @dev Require sufficient amount of Yellow tokens to be locked.
   * @param amount of Yellow tokens to be unlocked.
   */
  function unlock(uint256 amount) external;

  /**
   * @notice Get the amount of Yellow tokens locked by the account supplied.
   * @dev Get the amount of Yellow tokens locked by account supplied.
   * @return amount of tokens locked by the account supplied.
   */
  function lockedBy(address account) external view returns(uint256);

  // =================
  // Treasury
  // =================

  bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

  /**
   * @notice Allocate `amount` of Yellow tokens to `treasuryType` reserve.
   * @dev Require TREASURER_ROLE to invoke. Require supplied amount not to exceed Yellow token cap. Token allocation will happen to the address got from the hash supplied inside _balances mapping of Yellow token.
   * @param treasuryType Hash of the uppercase treasury name preceeded by "TREASURY_", e.g. keccak256("TREASURY_COMMUNITY").
   * @param amount of Yellow tokens to allocate.
   */
  function reserveAllocate(bytes32 treasuryType, uint256 amount) external; // onlyRole(TREASURER_ROLE)

  /**
   * @notice Transfer `amount` of Yellow tokens from `treasuryType` reserve to the `destination`.
   * @dev Require TREASURER_ROLE to invoke. Require supplied amount to be present at "treasury address".
   * @param treasuryType Hash of the uppercase treasury name preceeded by "TREASURY_", e.g. keccak256("TREASURY_COMMUNITY").
   * @param amount of Yellow tokens to transfer.
   * @param destination address.
   */
  function reserveTransfer(bytes32 treasuryType, uint256 amount, address destination) external; // onlyRole(TREASURER_ROLE)

  // =================
  // State channels
  // =================

  // TODO think about YellowImpl <-> NitroAdjudicator relations. More TODOs rely on this decision in this section.
  // Two approaches are possible:
  // 1. Nodes call the NitroAdjudicator to operate state channels and the latter invokes YellowImpl state channel statistic methods afterwards.
  // 2. Nodes call YellowImpl, which delegates state channel operating methods to the NitroAdjudicator, and the former invokes state channel statistic methods afterwards.

  bytes32 public constant ADJUDICATOR_ROLE = keccak256("ADJUDICATOR_ROLE");

  struct ChannelCounter {
    uint8 reserved;
    uint8 terminated;
    uint8 concluded;
  }

  mapping(address => ChannelCounter) private _channelsOf;

  // TODO spec
  function reserveChannel(address node) external; // onlyRole(ADJUDICATOR_ROLE)
  
  // TODO spec
  function releaseChannel(address node) external; // onlyRole(ADJUDICATOR_ROLE)

  // TODO spec
  function terminateChannel(address node) external; // onlyRole(ADJUDICATOR_ROLE)


  // TODO Is anyone allowed to see the number of available channels of anyone?
  /**
   * @notice Get number of available channels for a node specified.
   * @dev Get number of available channels for a node specified.
   * @param node address to chech available channels of.
   * @return Number of available state channels for a node specified.
   */
  function availableChannels(address node) external view returns(uint8);

  /**
   * @notice Get number of reserved channels for a node specified.
   * @dev Get number of reserved channels for a node specified.
   * @param node address to chech reserved channels of.
   * @return Number of reserved state channels for a node specified.
   */
  function reservedChannels(address node) external view returns(uint8);

  /**
   * @notice Get number of terminated channels for a node specified.
   * @dev Get number of terminated channels for a node specified.
   * @param node address to chech terminated channels of.
   * @return Number of terminated state channels for a node specified.
   */
  function terminatedChannels(address node) external view returns(uint8);

  /**
   * @notice Get number of concluded channels for a node specified.
   * @dev Get number of concluded channels for a node specified.
   * @param node address to chech concluded channels of.
   * @return Number of concluded state channels for a node specified.
   */
  function concludedChannels(address node) external view returns(uint8);
  
  // =================
  // Entity Registry
  // =================

  // TODO tackle _labels problem, namely inability to supply types containing (nested) mappings to external and public functions.
  // Search for FIXME label.

  bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

  // to describe and identify YN Nodes
  struct NodeInfo {
    // hash of the first domain
    bytes32 _id;

    // any number of labels can be added
    // keccak256(label_name) => keccak256(abi.encode(label_value))
    mapping(bytes32 => bytes32) _labels;
  }
  
  enum RegistryChangeType {REGISTRY_ADD, REGISTRY_MODIFY, REGISTRY_REMOVE }

  struct RegistryChange {
    uint8 _changeType;
    NodeInfo _info;
  }

  // Latest snapshot id
  uint256 private _latestSid;

  mapping(uint256 => RegistryChange[]) private _entityRegistry;

  RegistryChange[] private _pendingShapshot;

  event RegistryUpdated(uint256 newSid);

  /**
   * @notice Get latest snapshot id for the node to fetch only needed data.
   * @dev Get latest snapshot id for the node to fetch only needed data.
   * @return Id of the latest snapshot.
   */
  function lastSnapshot() external view returns(uint256);

  /**
   * @notice Fetch all node registry.
   * @dev It is more optimal to fetch only the unseed part of the registry using `fetchRegistry` method.
   * @return Array of struct describing registry changes.
   */
  // FIXME 
  function fetchAllRegistry() external returns(RegistryChange[]);

  /**
   * @notice Fetch changes to the registry since `startSid`.
   * @dev This method is more optimal to use in case a node already possesses a part of the registry.
   * @return Array of struct describing registry changes.
   */
  // FIXME 
  function fetchRegistry(uint256 startSid) external returns(RegistryChange[]);

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
  // FIXME 
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

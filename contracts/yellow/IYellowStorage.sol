//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/IAccessControl.sol';

interface IYellowStorage is IAccessControl {
  // =================
  // Fields
  // =================

  // bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

  // Storage maps
  // mapping(bytes32 => string)     private stringStorage;
  // mapping(bytes32 => bytes)      private bytesStorage; // can also store encoded structs
  // mapping(bytes32 => uint256)    private uintStorage;
  // mapping(bytes32 => int256)     private intStorage;
  // mapping(bytes32 => address)    private addressStorage;
  // mapping(bytes32 => bool)       private booleanStorage;
  // mapping(bytes32 => bytes32)    private bytes32Storage;


  // =================
  // Getters
  // =================

  /**
   * @notice Get address stored at `_key` at addressStorage.
   * @dev Get address stored at `_key` at addressStorage.
   * @param _key A key to query a value for.
   * @return address stored at `_key` at addressStorage.
   */
  function getAddress(bytes32 _key) external view returns (address);

  /**
   * @notice Get uint stored at `_key` at uintStorage.
   * @dev Get uint stored at `_key` at uintStorage.
   * @param _key A key to query a value for.
   * @return uint stored at `_key` at uintStorage.
   */
  function getUint(bytes32 _key) external view returns (uint256);

  /**
   * @notice Get string stored at `_key` at stringStorage.
   * @dev Get string stored at `_key` at stringStorage.
   * @param _key A key to query a value for.
   * @return string stored at `_key` at stringStorage.
   */
  function getString(bytes32 _key) external view returns (string memory);

  /**
   * @notice Get bytes stored at `_key` at bytesStorage.
   * @dev Get bytes stored at `_key` at bytesStorage.
   * @param _key A key to query a value for.
   * @return bytes stored at `_key` at bytesStorage.
   */
  function getBytes(bytes32 _key) external view returns (bytes memory);

  /**
   * @notice Get bool stored at `_key` at boolStorage.
   * @dev Get bool stored at `_key` at boolStorage.
   * @param _key A key to query a value for.
   * @return bool stored at `_key` at boolStorage.
   */
  function getBool(bytes32 _key) external view returns (bool);

  /**
   * @notice Get int stored at `_key` at intStorage.
   * @dev Get int stored at `_key` at intStorage.
   * @param _key A key to query a value for.
   * @return int stored at `_key` at intStorage.
   */
  function getInt(bytes32 _key) external view returns (int);

  /**
   * @notice Get bytes32 stored at `_key` at bytes32Storage.
   * @dev Get bytes32 stored at `_key` at bytes32Storage.
   * @param _key A key to query a value for.
   * @return bytes32 stored at `_key` at bytes32Storage.
   */
  function getBytes32(bytes32 _key) external view returns (bytes32);


  // =================
  // Setters
  // =================

  /**
   * @notice Set address stored at `_key` to a `_value`.
   * @dev Require MANAGER_ROLE to invoke.
   * @param _key A key to store a `_value` at.
   * @param _value A value to be stored at `_key`.
   */
  function setAddress(bytes32 _key, address _value) external; // onlyRole(MANAGER_ROLE)

  /**
   * @notice Set uint stored at `_key` to a `_value`.
   * @dev Require MANAGER_ROLE to invoke.
   * @param _key A key to store a `_value` at.
   * @param _value A value to be stored at `_key`.
   */
  function setUint(bytes32 _key, uint _value) external; // onlyRole(MANAGER_ROLE)

  /**
   * @notice Set string stored at `_key` to a `_value`.
   * @dev Require MANAGER_ROLE to invoke.
   * @param _key A key to store a `_value` at.
   * @param _value A value to be stored at `_key`.
   */
  function setString(bytes32 _key, string calldata _value) external; // onlyRole(MANAGER_ROLE)

  /**
   * @notice Set bytes stored at `_key` to a `_value`.
   * @dev Require MANAGER_ROLE to invoke.
   * @param _key A key to store a `_value` at.
   * @param _value A value to be stored at `_key`.
   */
  function setBytes(bytes32 _key, bytes calldata _value) external; // onlyRole(MANAGER_ROLE)

  /**
   * @notice Set bool stored at `_key` to a `_value`.
   * @dev Require MANAGER_ROLE to invoke.
   * @param _key A key to store a `_value` at.
   * @param _value A value to be stored at `_key`.
   */
  function setBool(bytes32 _key, bool _value) external; // onlyRole(MANAGER_ROLE)

  /**
   * @notice Set int stored at `_key` to a `_value`.
   * @dev Require MANAGER_ROLE to invoke.
   * @param _key A key to store a `_value` at.
   * @param _value A value to be stored at `_key`.
   */
  function setInt(bytes32 _key, int _value) external; // onlyRole(MANAGER_ROLE)

  /**
   * @notice Set bytes32 stored at `_key` to a `_value`.
   * @dev Require MANAGER_ROLE to invoke.
   * @param _key A key to store a `_value` at.
   * @param _value A value to be stored at `_key`.
   */
  function setBytes32(bytes32 _key, bytes32 _value) external; // onlyRole(MANAGER_ROLE)


  // =================
  // Deleters
  // =================

  /**
   * @notice Delete an address stored at a `_key`.
   * @dev Require MANAGER_ROLE to invoke.
   * @param _key A key to remove a value at.
   */
  function deleteAddress(bytes32 _key) external; // onlyRole(MANAGER_ROLE)

  /**
   * @notice Delete an uint stored at a `_key`.
   * @dev Require MANAGER_ROLE to invoke.
   * @param _key A key to remove a value at.
   */
  function deleteUint(bytes32 _key) external; // onlyRole(MANAGER_ROLE)

  /**
   * @notice Delete string stored at a `_key`.
   * @dev Require MANAGER_ROLE to invoke.
   * @param _key A key to remove a value at.
   */
  function deleteString(bytes32 _key) external; // onlyRole(MANAGER_ROLE)

  /**
   * @notice Delete bytes stored at a `_key`.
   * @dev Require MANAGER_ROLE to invoke.
   * @param _key A key to remove a value at.
   */
  function deleteBytes(bytes32 _key) external; // onlyRole(MANAGER_ROLE)

  /**
   * @notice Delete bool stored at a `_key`.
   * @dev Require MANAGER_ROLE to invoke.
   * @param _key A key to remove a value at.
   */
  function deleteBool(bytes32 _key) external; // onlyRole(MANAGER_ROLE)

  /**
   * @notice Delete int stored at a `_key`.
   * @dev Require MANAGER_ROLE to invoke.
   * @param _key A key to remove a value at.
   */
  function deleteInt(bytes32 _key) external; // onlyRole(MANAGER_ROLE)

  /**
   * @notice Delete bytes32 stored at a `_key`.
   * @dev Require MANAGER_ROLE to invoke.
   * @param _key A key to remove a value at.
   */
  function deleteBytes32(bytes32 _key) external; // onlyRole(MANAGER_ROLE)
}

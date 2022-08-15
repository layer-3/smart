//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import '@openzeppelin/contracts/access/IAccessControl.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

interface IYellow is IERC20, IAccessControl {
  // =================
  // ERC20
  // =================

  function mint(address to, uint256 amount) external; // onlyRole(DEFAULT_ADMIN_ROLE)

  function burn(address from, uint256 amount) external; // onlyRole(DEFAULT_ADMIN_ROLE)

  function dilute(uint256 newCap) external; // onlyRole(DEFAULT_ADMIN_ROLE)
  
  // =================
  // Locking
  // =================

  // mapping(address => uint256) _lockedBy;

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

  // bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

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
}

//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

import './Upgradeability.sol';

abstract contract Locking is AccessControl, Upgradeability {
	// ======================
	// Roles
	// ======================

	bytes32 public constant LOCKING_MAINTAINER_ROLE = keccak256('LOCKING_MAINTAINER_ROLE');

	// ======================
	// Fields
	// ======================

	mapping(address => uint256) internal _lockedBy;

	IERC20 public yellowToken;

	// ======================
	// Yellow token
	// ======================

	function setYellowToken(IERC20 _yellowToken) external onlyRole(LOCKING_MAINTAINER_ROLE) {
		yellowToken = _yellowToken;
	}

	// ======================
	// Locking
	// ======================

	function lock(uint256 amount) external {
		address account = msg.sender;

		// transfer to Locking contract
		bool success = yellowToken.transferFrom(account, address(this), amount);
		require(success, 'Could not transfer Yellow token');

		_lockedBy[account] += amount;

		emit TokenLocked(account, amount);
	}

	function unlock(uint256 amount) external {
		address account = msg.sender;

		// account checks
		require(_lockedBy[account] >= amount, 'Insufficient balance to unlock');

		// transfer from Locking contract
		bool success = yellowToken.transfer(account, amount);
		require(success, 'Could not transfer Yellow token');

		_lockedBy[account] -= amount;

		emit TokenUnlocked(account, amount);
	}

	// ======================
	// Internal
	// ======================

	function _migrateLockedTokensTo(
		Locking to,
		address account,
		uint256 amount
	) internal {
		bool success = yellowToken.transfer(address(to), amount);
		require(success, 'Could not transfer Yellow token');

		to._migrateLockedTokens(account, amount);
	}

	function _migrateLockedTokens(address account, uint256 amount)
		public
		virtual
		onlyLeftImplementation(Upgradeability(msg.sender))
	{
		_lockedBy[account] = amount;
		emit LockedTokensMigratedTo(account, amount, address(this));
	}

	// ======================
	// Events
	// ======================

	event TokenLocked(address indexed account, uint256 amount);

	event TokenUnlocked(address indexed account, uint256 amount);

	event LockedTokensMigratedFrom(address indexed account, uint256 amount, address indexed from);

	event LockedTokensMigratedTo(address indexed account, uint256 amount, address indexed to);
}

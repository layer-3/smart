//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import './YellowAccessControl.sol';
import './YellowClearingUpgradeability.sol';

abstract contract YellowLocking is YellowAccessControl, YellowClearingUpgradeability {
	mapping(address => uint256) internal _lockedBy;

	IERC20 internal _yellowToken;

	// ======================
	// Yellow token
	// ======================

	function setYellowToken(IERC20 yellowToken_) external onlyRole(LOCKING_MAINTAINER_ROLE) {
		_yellowToken = yellowToken_;
	}

	function getYellowToken() external view returns (IERC20) {
		return _yellowToken;
	}

	// ======================
	// Locking
	// ======================

	function lock(uint256 amount) external {
		address account = msg.sender;

		bool success = _yellowToken.transferFrom(account, address(this), amount);

		require(success, 'Could not transfer Yellow token');

		_lockedBy[account] += amount;

		emit TokenLocked(account, amount);
	}

	function unlock(uint256 amount) external {
		address account = msg.sender;

		require(_lockedBy[account] >= amount, 'Insufficient balance to unlock');

		bool success = _yellowToken.transfer(account, amount);

		require(success, 'Could not transfer Yellow token');

		_lockedBy[account] -= amount;

		emit TokenUnlocked(account, amount);
	}

	// ======================
	// Internal
	// ======================

	function _migrateLockedTokensTo(
		YellowLocking to,
		address account,
		uint256 amount
	) internal {
		bool success = _yellowToken.transfer(address(to), amount);
		require(success, 'Could not transfer Yellow token');

		to._migrateLockedTokens(account, amount);

		emit LockedTokensMigratedTo(account, amount, address(this));
	}

	function _migrateLockedTokens(address account, uint256 amount)
		public
		virtual
		onlyLeftImplementation(YellowClearingUpgradeability(msg.sender))
	{
		_lockedBy[account] = amount;
	}

	// ======================
	// Events
	// ======================

	event TokenLocked(address indexed account, uint256 amount);

	event TokenUnlocked(address indexed account, uint256 amount);

	event LockedTokensMigratedFrom(address indexed account, uint256 amount, address indexed from);
	event LockedTokensMigratedTo(address indexed account, uint256 amount, address indexed to);
}

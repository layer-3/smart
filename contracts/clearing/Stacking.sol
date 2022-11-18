//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

abstract contract Stacking is AccessControl {
	// ======================
	// Roles
	// ======================

	bytes32 public constant STACKING_MAINTAINER_ROLE = keccak256('STACKING_MAINTAINER_ROLE');

	// ======================
	// Fields
	// ======================

	mapping(address => uint256) public stackedBy;
	mapping(address => uint256) public lockedBy;

	IERC20Metadata public yellowToken;

	// ======================
	// Yellow token
	// ======================

	function setYellowToken(IERC20Metadata _yellowToken)
		external
		onlyRole(STACKING_MAINTAINER_ROLE)
	{
		yellowToken = _yellowToken;
	}

	function availableYellowTokens(address account) public view returns (uint256) {
		return stackedBy[account] - lockedBy[account];
	}

	// ======================
	// Staking
	// ======================

	function stackYellowTokens(address account, uint256 amount) external {
		_requireEligibleForStacking(account);

		// transfer to Stacking contract
		bool success = yellowToken.transferFrom(account, address(this), amount);
		require(success, 'Could not transfer Yellow token');

		stackedBy[account] += amount;

		emit YellowTokenStacked(account, amount);
	}

	function unstackYellowTokens(
		address account,
		uint256 amount,
		bytes memory signature
	) external {
		// account checks
		require(
			availableYellowTokens(account) >= amount,
			'Insufficient stacked balance to unstack'
		);

		_requireEligibleForUnstacking(account, signature);
		// _identifyRequest(account, identityPayloadSignature);

		stackedBy[account] -= amount;

		// transfer from Stacking contract
		bool success = yellowToken.transfer(account, amount);
		require(success, 'Could not transfer Yellow token');

		emit YellowTokenUnstacked(account, amount);
	}

	// ======================
	// Internal stacking
	// ======================

	function _requireEligibleForStacking(address account) internal virtual {}

	function _requireEligibleForUnstacking(address account, bytes memory signature)
		internal
		virtual
	{}

	// ======================
	// Internal locking
	// ======================

	function _lockYellowTokens(address account, uint256 amount) internal {
		require(availableYellowTokens(account) >= amount, 'Insufficient stacked balance to lock');

		lockedBy[account] += amount;

		emit YellowTokenLocked(account, amount);
	}

	function _unlockYellowTokens(address account, uint256 amount) internal {
		// account checks
		require(lockedBy[account] >= amount, 'Insufficient locked balance to unlock');

		lockedBy[account] -= amount;

		emit YellowTokenUnlocked(account, amount);
	}

	// ======================
	// Events
	// ======================

	event YellowTokenStacked(address indexed account, uint256 amount);

	event YellowTokenUnstacked(address indexed account, uint256 amount);

	event YellowTokenLocked(address indexed account, uint256 amount);

	event YellowTokenUnlocked(address indexed account, uint256 amount);
}

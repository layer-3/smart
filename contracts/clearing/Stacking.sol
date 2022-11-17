//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol';

import './Registry.sol';

abstract contract Stacking is Registry {
	IERC20MetadataUpgradeable public yellowToken;

	mapping(address => uint256) public stackedYellowTokens;
	mapping(address => uint256) public lockedYellowTokens;

	function availableYellowTokens(address participant) public view returns (uint256) {
		return stackedYellowTokens[participant] - lockedYellowTokens[participant];
	}

	function stackYellowTokens(address participant, uint256 amount) external {
		_requireParticipantExists(participant);

		bool success = yellowToken.transferFrom(msg.sender, address(this), amount);
		require(success, 'yellow tokens transfer failed');

		stackedYellowTokens[participant] += amount;

		emit YellowTokensStacked(participant, amount);
	}

	function unstackYellowTokens(
		address participant,
		uint256 amount,
		bytes memory identityPayloadSignature
	) external {
		require(
			availableYellowTokens(participant) >= amount,
			'insufficient available yellow tokens'
		);

		_identify(participant, identityPayloadSignature);

		stackedYellowTokens[participant] -= amount;

		bool success = yellowToken.transfer(msg.sender, amount);
		require(success, 'yellow tokens transfer failed');

		emit YellowTokensUnstacked(participant, amount);
	}

	function _lockYellowTokens(address participant, uint256 amount) internal {
		require(
			availableYellowTokens(participant) >= amount,
			'insufficient available yellow tokens'
		);

		lockedYellowTokens[participant] += amount;

		emit YellowTokensLocked(participant, amount);
	}

	function _unlockYellowTokens(address participant, uint256 amount) internal {
		require(lockedYellowTokens[participant] >= amount, 'insufficient locked yellow tokens');

		lockedYellowTokens[participant] -= amount;

		emit YellowTokensUnlocked(participant, amount);
	}

	event YellowTokensStacked(address indexed participant, uint256 amount);

	event YellowTokensUnstacked(address indexed participant, uint256 amount);

	event YellowTokensLocked(address indexed participant, uint256 amount);

	event YellowTokensUnlocked(address indexed participant, uint256 amount);
}

//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol';
import '@openzeppelin/contracts/utils/math/Math.sol';
import '@openzeppelin/contracts/utils/math/SafeCast.sol';

import './Identity.sol';
import './Registry.sol';

// TODO: events

abstract contract Channel is Identity, Registry {
	using Math for uint256;
	using SafeCast for uint256;

	bytes32 public constant CHANNEL_ADJUDICATOR_ROLE = keccak256('CHANNEL_ADJUDICATOR_ROLE');

	uint256 public constant CHANNEL_INCREMENT = 4;
	uint256 public constant YELLOW_TOKENS_PER_CHANNEL_INCREMENT = 250_000;
	uint256 public constant MAXIMUM_CHANNELS = 64;

	uint64 public constant FAILED_CHANNEL_RELEASE_PERIOD = 30 days;

	address public yellowAdjudicator;
	IERC20MetadataUpgradeable public yellowToken;

	// participant => associated addresses
	mapping(address => address[]) public associatedAddresses;
	// associated address => participant
	mapping(address => address) public associatedParticipant;

	mapping(address => uint8) public activeChannels;
	mapping(address => uint64[]) public failedChannels;

	mapping(address => uint256) public stackedYellowTokens;

	function totalChannels(address participant) public view returns (uint8) {
		return
			((stackedYellowTokens[participant] /
				(YELLOW_TOKENS_PER_CHANNEL_INCREMENT * yellowToken.decimals())) * CHANNEL_INCREMENT)
				.min(MAXIMUM_CHANNELS)
				.toUint8();
	}

	function engagedChannels(address participant) public view returns (uint8) {
		return (activeChannels[participant] + failedChannels[participant].length).toUint8();
	}

	function availableChannels(address participant) public view returns (uint8) {
		return totalChannels(participant) - engagedChannels(participant);
	}

	function activateChannel(address participant) external onlyRole(CHANNEL_ADJUDICATOR_ROLE) {
		require(availableChannels(participant) > 0, 'no available channel');

		activeChannels[participant]++;
	}

	function failChannel(address participant) external onlyRole(CHANNEL_ADJUDICATOR_ROLE) {
		require(activeChannels[participant] > 0, 'no active channel');

		activeChannels[participant]--;
		failedChannels[participant].push(uint64(block.timestamp));
	}

	function deactivateChannel(address participant) external onlyRole(CHANNEL_ADJUDICATOR_ROLE) {
		require(activeChannels[participant] > 0, 'no active channel');

		activeChannels[participant]--;
	}

	function releasableFailedChannels(address participant) external view returns (uint8) {
		uint8 count = 0;
		uint64[] storage failedChs = failedChannels[participant];

		for (uint256 i = 0; i < failedChs.length; i++) {
			if (failedChs[i] + FAILED_CHANNEL_RELEASE_PERIOD <= block.timestamp) {
				count++;
			}
		}

		return count;
	}

	function releaseFailedChannels(address participant) external {
		uint64[] storage failedChs = failedChannels[participant];

		for (uint256 i = 0; i < failedChs.length; i++) {
			if (failedChs[i] + FAILED_CHANNEL_RELEASE_PERIOD < block.timestamp) {
				failedChs[i] = failedChs[failedChs.length - 1];
				failedChs.pop();

				i--;
			}
		}
	}

	function engagedYellowTokens(address participant) public view returns (uint256) {
		return
			stackedYellowTokens[participant] -
			uint256(engagedChannels(participant)).ceilDiv(CHANNEL_INCREMENT) *
			YELLOW_TOKENS_PER_CHANNEL_INCREMENT *
			yellowToken.decimals();
	}

	function availableYellowTokens(address participant) public view returns (uint256) {
		return stackedYellowTokens[participant] - engagedYellowTokens(participant);
	}

	function stackYellowTokens(address participant, uint256 amount) external {
		_requireParticipantExists(participant);

		bool success = yellowToken.transferFrom(msg.sender, address(this), amount);
		require(success, 'yellow tokens transfer failed');

		stackedYellowTokens[participant] += amount;
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
	}
}

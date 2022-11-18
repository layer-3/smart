//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '@openzeppelin/contracts/utils/math/SafeCast.sol';

import './Stacking.sol';

abstract contract Channel is Stacking {
	using SafeCast for uint256;

	bytes32 public constant CHANNEL_ADJUDICATOR_ROLE = keccak256('CHANNEL_ADJUDICATOR_ROLE');

	uint8 public constant CHANNEL_INCREMENT = 4;
	uint256 public constant YELLOW_TOKENS_PER_CHANNEL_INCREMENT = 250_000;
	uint8 public constant MAXIMUM_CHANNELS = 64;

	uint64 public constant TERMINATED_CHANNEL_RELEASE_PERIOD = 30 days;

	address public yellowAdjudicator;

	mapping(address => uint8) public activeChannels;
	mapping(address => uint64[]) public terminatedChannels;

	function yellowTokensPerChannelIncrement() public view returns (uint256) {
		return YELLOW_TOKENS_PER_CHANNEL_INCREMENT * (10 ^ yellowToken.decimals());
	}

	function engagedChannels(address participant) public view returns (uint8) {
		return (activeChannels[participant] + terminatedChannels[participant].length).toUint8();
	}

	function availableChannels(address participant) external view returns (uint8) {
		return
			CHANNEL_INCREMENT -
			(engagedChannels(participant) % 4) +
			(availableYellowTokens(participant) / yellowTokensPerChannelIncrement()).toUint8() *
			CHANNEL_INCREMENT;
	}

	function activateChannel(address participant) external onlyRole(CHANNEL_ADJUDICATOR_ROLE) {
		uint8 engagedCount = engagedChannels(participant) + 1;

		require(engagedCount <= MAXIMUM_CHANNELS, 'Maximum number of channels reached');

		if (engagedCount % CHANNEL_INCREMENT == 1) {
			_lockYellowTokens(participant, yellowTokensPerChannelIncrement());
		}

		activeChannels[participant]++;

		emit ChannelActivated(participant);
	}

	function deactivateChannel(address participant) external onlyRole(CHANNEL_ADJUDICATOR_ROLE) {
		require(activeChannels[participant] > 0, 'No active channel');

		activeChannels[participant]--;

		emit ChannelDeactivated(participant);

		if (engagedChannels(participant) % CHANNEL_INCREMENT == 0) {
			_unlockYellowTokens(participant, yellowTokensPerChannelIncrement());
		}
	}

	function terminateChannel(address participant) external onlyRole(CHANNEL_ADJUDICATOR_ROLE) {
		require(activeChannels[participant] > 0, 'No active channel');

		activeChannels[participant]--;
		terminatedChannels[participant].push(uint64(block.timestamp));

		emit ChannelTerminated(participant);
	}

	function releasableTerminatedChannels(address participant) external view returns (uint8) {
		uint8 releasableCount = 0;

		uint64[] storage terminatedChans = terminatedChannels[participant];
		for (uint256 i = 0; i < terminatedChans.length; i++) {
			if (terminatedChans[i] + TERMINATED_CHANNEL_RELEASE_PERIOD <= block.timestamp) {
				releasableCount++;
			}
		}

		return releasableCount;
	}

	function releaseTerminatedChannels(address participant) external returns (uint8) {
		uint8 releasedCount = 0;

		uint8 engagedCount = engagedChannels(participant);
		uint256 unlockAmount = yellowTokensPerChannelIncrement();
		uint64[] storage terminatedChans = terminatedChannels[participant];
		for (uint256 i = 0; i < terminatedChans.length; i++) {
			if (terminatedChans[i] + TERMINATED_CHANNEL_RELEASE_PERIOD <= block.timestamp) {
				terminatedChans[i] = terminatedChans[terminatedChans.length - 1];
				terminatedChans.pop();
				i--;

				engagedCount--;
				if (engagedCount % CHANNEL_INCREMENT == 0) {
					_unlockYellowTokens(participant, unlockAmount);
				}

				releasedCount++;
			}
		}

		emit TerminatedChannelReleased(participant, releasedCount);

		return releasedCount;
	}

	event ChannelActivated(address indexed participant);

	event ChannelDeactivated(address indexed participant);

	event ChannelTerminated(address indexed participant);

	event TerminatedChannelReleased(address indexed participant, uint8 releasedCount);
}

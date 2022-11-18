//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

abstract contract Statistics {
	// ======================
	// General network
	// ======================

	// register -> increase, migrate -> decrease
	uint16 public numberOfParticipants;
	uint32 public numberOfChannels;

	// for the period of network existence (statistics only increasing)
	uint32 public numberOfTerminatedChannels;

	function _incrementParticipants() internal {
		numberOfParticipants++;
	}

	function _decrementParticipants() internal {
		numberOfParticipants--;
	}

	function _incrementChannels() internal {
		numberOfChannels++;
	}

	function _decrementChannels() internal {
		numberOfChannels--;
	}

	function _incrementTerminatedChannels() internal {
		numberOfTerminatedChannels++;
	}

	function _decrementTerminatedChannels() internal {
		numberOfTerminatedChannels--;
	}

	// ======================
	// Per participant
	// ======================

	struct ParticipantStatistics {
		uint16 terminatedChannels;
		uint256 settledAmount;
	}

	mapping(address => ParticipantStatistics) public statisticsFor;

	function _incrementTerminatedChannelsFor(address participant) internal {
		statisticsFor[participant].terminatedChannels++;
	}

	function _decrementTerminatedChannelsFor(address participant) internal {
		statisticsFor[participant].terminatedChannels--;
	}

	function _increaseSettledAmountFor(address participant, uint256 amount) internal {
		statisticsFor[participant].settledAmount += amount;
	}

	function _decreaseSettledAmountFor(address participant, uint256 amount) internal {
		statisticsFor[participant].settledAmount -= amount;
	}

	// ======================
	// Terminated combined
	// ======================

	function _saveTerminatedChannelToStatistics(address participant) internal {
		_decrementChannels();
		_incrementTerminatedChannels();
		_incrementTerminatedChannelsFor(participant);
	}

	function _removeTerminatedChannelFromStatistics(address participant) internal {
		_incrementChannels();
		_decrementTerminatedChannels();
		_decrementTerminatedChannelsFor(participant);
	}
}

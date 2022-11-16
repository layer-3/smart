//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
pragma experimental ABIEncoderV2;

import '@statechannels/nitro-protocol/contracts/interfaces/IForceMoveApp.sol';

abstract contract App is IForceMoveApp {
	struct Liability {
		uint256 chainId;
		address token;
		uint256 quantity;
	}

	struct StateData {
		// from participant => to participant => liability[]
		mapping(address => mapping(address => Liability[])) liabilities;
	}

	function requireStateSupported(
		FixedPart calldata fixedPart,
		RecoveredVariablePart[] calldata proof,
		RecoveredVariablePart calldata candidate
	) external pure override(IForceMoveApp) {
		//
	}
}

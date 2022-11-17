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
		// TODO: check that candidate outcome match unsettled liabilities (from latest supported state)
		//
		// Exemple:
		// latest supported outcome:
		// - Alice: 5,000 USDC
		// - Bob: 5,000 USDC
		// latest supported liabilities:
		// - Alice => Bob: 1 ETH
		// candidate outcome (with 1 ETH collateral value is equivalent to 1,000 USDC):
		// - Alice: 4,000 USDC (5,000 - 1,000)
		// - Bob: 6,000 USDC (5,000 + 1,000)
		//
		// The main complexity here is to get liability collateral value in the same currency as the outcome
		// This is why we may be limited to a single collateral token for now (USDC)
		//
		// One other solution could be to include latest collateral value in the state
		//
		// But for both solutions the problem of challenge duration is still there:
		// - If we use a single collateral token, we need to be sure that the collateral value is not too volatile
		// - If we include latest collateral value in the state, both parties need to agree on the collateral value
	}
}

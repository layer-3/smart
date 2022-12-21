// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
pragma experimental ABIEncoderV2;

import '@statechannels/nitro-protocol/contracts/interfaces/IForceMoveApp.sol';
import '@statechannels/nitro-protocol/contracts/libraries/NitroUtils.sol';
import '@statechannels/nitro-protocol/contracts/interfaces/INitroTypes.sol';
import {ExitFormat as Outcome} from '@statechannels/exit-format/contracts/ExitFormat.sol';

// NOTE: Attack:
// Bob can submit a convenient candidate, when Alice in trouble (Way back machine attack)

// Possible solutions:
// 1: Alice does checkpoint periodically
// 2: Alice hire a WatchTower, which replicates Alice's states,
// and challenge in the case of challenge event and missing heartbeat

/**
 * @dev The VirtualMarginApp contract complies with the ForceMoveApp interface and allows payments to be made virtually from Initiator to Receiver (participants[0] to participants[n+1], where n is the number of intermediaries).
 */
contract VirtualMarginApp is IForceMoveApp {
	struct MarginProof {
		INitroTypes.Signature leaderSignature;
		INitroTypes.Signature receiverSignature;
		uint256 version;
		uint256 leaderMargin;
		uint256 receiverMargin;
	}

	enum AllocationIndices {
		Initiator,
		Receiver
	}

	/**
	 * @notice Encodes application-specific rules for a particular ForceMove-compliant state channel.
	 * @dev Encodes application-specific rules for a particular ForceMove-compliant state channel.
	 * @param fixedPart Fixed part of the state channel.
	 * @param proof Array of recovered variable parts which constitutes a support proof for the candidate.
	 * @param candidate Recovered variable part the proof was supplied for.
	 */
	function requireStateSupported(
		FixedPart calldata fixedPart,
		RecoveredVariablePart[] calldata proof,
		RecoveredVariablePart calldata candidate
	) external pure override {
		// This channel has only 4 states which can be supported:
		// 0    prefund
		// 1    postfund
		// 2+   margin call
		// 3+   final

		uint8 nParticipants = uint8(fixedPart.participants.length);

		// states 0,1,3+:

		if (proof.length == 0) {
			require(
				NitroUtils.getClaimedSignersNum(candidate.signedBy) == nParticipants,
				'!unanimous'
			);

			if (candidate.variablePart.turnNum == 0) return; // prefund
			if (candidate.variablePart.turnNum == 1) return; // postfund

			// final
			if (candidate.variablePart.turnNum >= 3) {
				// final (note: there is a core protocol escape hatch for this, too, so it could be removed)
				require(candidate.variablePart.isFinal, '!final; turnNum>=3 && |proof|=0');
				return;
			}

			revert('bad candidate turnNum; |proof|=0');
		}

		// state 2+ requires postfund state to be supplied

		if (proof.length == 1) {
			_requireProofOfUnanimousConsensusOnPostFund(proof[0], nParticipants);

			require(candidate.variablePart.turnNum >= 2, 'turnNum < 2; |proof|=1');

			// supplied state must be signed by either party
			require(
				NitroUtils.isClaimedSignedBy(candidate.signedBy, 0) ||
					NitroUtils.isClaimedSignedBy(candidate.signedBy, nParticipants - 1),
				'no identity proof on margin call state'
			);

			_requireValidMarginProof(fixedPart, candidate.variablePart);

			_requireValidOutcomeTransition(
				proof[0].variablePart.outcome,
				candidate.variablePart.outcome,
				fixedPart.participants[0],
				fixedPart.participants[nParticipants - 1],
				nParticipants
			);
			return;
		}
		revert('bad proof length');
	}

	function _requireProofOfUnanimousConsensusOnPostFund(
		RecoveredVariablePart memory rVP,
		uint256 numParticipants
	) internal pure {
		require(rVP.variablePart.turnNum == 1, 'bad proof[0].turnNum; |proof|=1');
		require(
			NitroUtils.getClaimedSignersNum(rVP.signedBy) == numParticipants,
			'postfund !unanimous; |proof|=1'
		);
	}

	function _requireValidMarginProof(
		FixedPart memory fixedPart,
		VariablePart memory variablePart
	) internal pure returns (uint256 leaderMargin, uint256 receiverMargin) {
		MarginProof memory marginProof = abi.decode(variablePart.appData, (MarginProof));

		// correct margin version
		require(marginProof.version == variablePart.turnNum, 'version != turnNum');

		// correct margin signatures
		address recoveredLeader = NitroUtils.recoverSigner(
			keccak256(abi.encode(NitroUtils.getChannelId(fixedPart), marginProof.version)),
			marginProof.leaderSignature
		);
		require(recoveredLeader == fixedPart.participants[0], 'invalid signature for voucher'); // could be incorrect channelId or incorrect signature

		address recoveredReceiver = NitroUtils.recoverSigner(
			keccak256(abi.encode(NitroUtils.getChannelId(fixedPart), marginProof.version)),
			marginProof.receiverSignature
		);
		require(
			recoveredReceiver == fixedPart.participants[fixedPart.participants.length - 1],
			'invalid signature for voucher'
		); // could be incorrect channelId or incorrect signature

		// correct outcome adjustments
		require(
			variablePart.outcome[0].allocations[0].amount == leaderMargin,
			'incorrect leader margin'
		);
		require(
			variablePart.outcome[0].allocations[1].amount == receiverMargin,
			'incorrect receiver margin'
		);
	}

	function _requireValidOutcomeTransition(
		Outcome.SingleAssetExit[] memory oldOutcome,
		Outcome.SingleAssetExit[] memory newOutcome,
		address Leader,
		address Receiver,
		uint8 nParticipants
	) internal pure {
		// NOTE: do we need such strict rules?
		// is there a scenario they can be broken in a malicious way?

		// only 1 collateral asset (USDT) for now, 2 later (+ YellowToken)
		require(oldOutcome.length == 1 && newOutcome.length == 1, 'invalid number of assets');

		// only 2 allocations
		require(
			oldOutcome[0].allocations.length == 2 && newOutcome[0].allocations.length == 2,
			'invalid number of allocations'
		);

		// TODO: allocations are to Leader and Receiver
		// require(
		//     oldOutcome[0].allocations[0].destination == Leader &&
		//     oldOutcome[0].allocations[1].destination == Receiver &&
		//     newOutcome[0].allocations[0].destination == Leader &&
		//     newOutcome[0].allocations[1].destination == Receiver,
		//     'invalid number of allocations'
		// );

		// TODO: Add getter and setter, for Fee and collateral currencies
		// newOutcome[0].asset == ASSET_FEE_ADDRESS &&
		// newOutcome[1].asset == ASSET_COLLATERAL_ADDRESS,

		// equal sums
		uint256 oldAllocationSum;
		uint256 newAllocationSum;
		for (uint256 i = 0; i < nParticipants; i++) {
			oldAllocationSum += oldOutcome[0].allocations[i].amount;
			newAllocationSum += newOutcome[0].allocations[i].amount;
		}
		require(oldAllocationSum == newAllocationSum, 'total allocated cannot change');
	}
}

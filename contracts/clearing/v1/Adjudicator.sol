//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
pragma experimental ABIEncoderV2;

// import '@statechannels/nitro-protocol/contracts/MultiAssetHolder.sol';
import '@statechannels/nitro-protocol/contracts/NitroAdjudicator.sol';

abstract contract Adjudicator is NitroAdjudicator {
	// function deposit(
	// 	address asset,
	// 	bytes32 channelId,
	// 	uint256 expectedHeld,
	// 	uint256 amount
	// ) external payable override(MultiAssetHolder) {
	// 	super.deposit(asset, channelId, expectedHeld, amount);
	// }
}

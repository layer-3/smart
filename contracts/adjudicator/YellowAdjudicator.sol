//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
pragma experimental ABIEncoderV2;

// import '@statechannels/nitro-protocol/contracts/MultiAssetHolder.sol';
import '@statechannels/nitro-protocol/contracts/NitroAdjudicator.sol';

contract YellowAdjudicator is NitroAdjudicator {
	// TODO: check if msg.sender is participant of one of his associated addresses
	// function deposit(
	// 	address asset,
	// 	bytes32 channelId,
	// 	uint256 expectedHeld,
	// 	uint256 amount
	// ) external payable override(MultiAssetHolder) {
	// 	super.deposit(asset, channelId, expectedHeld, amount);
	// }
}

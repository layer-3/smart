//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

abstract contract Identity {
	using ECDSA for bytes32;

	struct Payload {
		address implementation;
		address participant;
		uint64 nonce;
	}

	mapping(address => uint64) public nonce;

	function getIdentityPayload(address participant) public view returns (bytes32) {
		return
			keccak256(
				abi.encode(
					Payload({
						implementation: address(this),
						participant: participant,
						nonce: nonce[participant]
					})
				)
			);
	}

	function recoverIdentitySigner(bytes32 payload, bytes memory payloadSignature)
		public
		pure
		returns (address)
	{
		return payload.toEthSignedMessageHash().recover(payloadSignature);
	}

	function isValidIdentitySignature(address participant, bytes memory payloadSignature)
		public
		view
		returns (bool)
	{
		return
			recoverIdentitySigner(getIdentityPayload(participant), payloadSignature) == participant;
	}

	function _identify(address participant, bytes memory payloadSignature) internal {
		require(
			isValidIdentitySignature(participant, payloadSignature),
			'invalid identity payload signature'
		);

		nonce[participant]++;
	}
}

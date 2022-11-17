//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

abstract contract Identity {
	using ECDSA for bytes32;

	// Participant identity payload
	struct Payload {
		address implementation;
		address participant;
		uint64 nonce;
	}

	mapping(address => uint64) public nonceOf;

	/**
	 * @notice Return identity payload structure for a supplied participant. Used to ease interaction with this contract.
	 * @dev Return identity payload structure for a supplied participant. Used to ease interaction with this contract.
	 * @param participant Address of participant to get identity payload for.
	 * @return IdentityPayload Identity payload structure for a supplied participant.
	 */
	function getIdentityPayload(address participant) public view returns (Payload memory) {
		return
			Payload({
				implementation: address(this),
				participant: participant,
				nonce: nonceOf[participant]
			});
	}

	/**
	 * @notice Recover signer of identity payload.
	 * @dev Recover signer of identity payload.
	 * @param identityPayload Identity payload that has been signed.
	 * @param signature Signed identity payload.
	 * @return address Address of the signer.
	 */
	function recoverIdentitySigner(Payload memory identityPayload, bytes memory signature)
		public
		pure
		returns (address)
	{
		return keccak256(abi.encode(identityPayload)).toEthSignedMessageHash().recover(signature);
	}

	function isValidIdentitySignature(address participant, bytes memory payloadSignature)
		public
		view
		returns (bool)
	{
		return
			recoverIdentitySigner(getIdentityPayload(participant), payloadSignature) == participant;
	}

	function _identifyRequest(address participant, bytes memory payloadSignature) internal {
		require(
			isValidIdentitySignature(participant, payloadSignature),
			'Invalid identity payload signature'
		);

		nonceOf[participant]++;
	}
}

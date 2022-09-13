import {utils, Signer} from 'ethers';

export async function encodeAndSign(message: string, signer: Signer): Promise<[string, string]> {
  const encodedMsg = utils.defaultAbiCoder.encode(['address'], [message]);
  const encodedMsgHash = utils.keccak256(encodedMsg);
  const encodedMsgHashBytes = utils.arrayify(encodedMsgHash);
  const signature = await signer.signMessage(encodedMsgHashBytes);
  return [encodedMsg, signature];
}

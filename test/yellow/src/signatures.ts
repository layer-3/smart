import {utils, Signer} from 'ethers';

export function signEncoded(signer: Signer, encodedData: string): Promise<string> {
  return signer.signMessage(utils.arrayify(utils.keccak256(encodedData)));
}

export async function encodeSelf(participant: Signer): Promise<string> {
  return await signEncoded(
    participant,
    utils.defaultAbiCoder.encode(['address'], [await participant.getAddress()])
  );
}

import {utils, Signer} from 'ethers';

export function signEncoded(signer: Signer, encodedData: string): Promise<string> {
  return signer.signMessage(utils.arrayify(utils.keccak256(encodedData)));
}

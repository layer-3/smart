import {ParamType} from '@ethersproject/abi';
import {utils, Signer} from 'ethers';

export function encodeAndSign(
  signer: Signer,
  types: ReadonlyArray<string | ParamType>,
  values: ReadonlyArray<any>
): Promise<string> {
  return signer.signMessage(
    utils.arrayify(utils.keccak256(utils.defaultAbiCoder.encode(types, values)))
  );
}

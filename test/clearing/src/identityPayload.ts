import { type ParamType, defaultAbiCoder } from 'ethers/lib/utils';

import { signEncoded } from '../../../src/signatures';

import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import type { BigNumber } from 'ethers';
import type { YellowClearingBase } from '../../../typechain';

export interface identityPayloadBN {
  YellowClearing: string;
  participant: string;
  nonce: BigNumber;
}

export interface identityPayload {
  YellowClearing: string;
  participant: string;
  nonce: number;
}

export async function getIdentityPayload(
  registry: YellowClearingBase,
  participant: SignerWithAddress,
): Promise<identityPayload> {
  const IPBN = await registry.getIdentityPayload(participant.address);

  return {
    YellowClearing: IPBN.YellowClearing,
    participant: IPBN.participant,
    nonce: IPBN.nonce.toNumber(),
  };
}

export async function signIdentityPayload(
  identityPayload: identityPayload,
  signer: SignerWithAddress,
): Promise<string> {
  const encodedIP = defaultAbiCoder.encode(
    [
      {
        type: 'tuple',
        components: [
          { name: 'YellowClearing', type: 'address' },
          { name: 'participant', type: 'address' },
          { name: 'nonce', type: 'uint64' },
        ],
      } as ParamType,
    ],
    [identityPayload],
  );
  return await signEncoded(signer, encodedIP);
}

type IdentityParams = [string, string];

export async function getAndSignIdentityPayload(
  registry: YellowClearingBase,
  participant: SignerWithAddress,
): Promise<IdentityParams> {
  const identityPayload = await getIdentityPayload(registry, participant);
  const sig = await signIdentityPayload(identityPayload, participant);
  return [participant.address, sig];
}

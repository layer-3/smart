import { type ParamType, defaultAbiCoder } from 'ethers/lib/utils';

import { signEncoded } from '../../../src/signatures';

import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import type { BigNumber } from 'ethers';
import type { YellowClearingBase } from '../../../typechain';

export interface InteractionPayloadBN {
  YellowClearing: string;
  participant: string;
  nonce: BigNumber;
}

export interface InteractionPayload {
  YellowClearing: string;
  participant: string;
  nonce: number;
}

export async function getInteractionPayload(
  registry: YellowClearingBase,
  participant: SignerWithAddress,
): Promise<InteractionPayload> {
  const IPBN = await registry.getInteractionPayload(participant.address);

  return {
    YellowClearing: IPBN.YellowClearing,
    participant: IPBN.participant,
    nonce: IPBN.nonce.toNumber(),
  };
}

export async function signInteractionPayload(
  interactionPayload: InteractionPayload,
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
    [interactionPayload],
  );
  return await signEncoded(signer, encodedIP);
}

type InteractionParams = [string, string];

export async function getAndSignInteractionPayload(
  registry: YellowClearingBase,
  participant: SignerWithAddress,
): Promise<InteractionParams> {
  const interactionPayload = await getInteractionPayload(registry, participant);
  const sig = await signInteractionPayload(interactionPayload, participant);
  return [participant.address, sig];
}

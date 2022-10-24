import {
  InteractionPayload,
  getAndSignInteractionPayload,
  signInteractionPayload,
} from './interactionPayload';

import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import type { YellowClearingBase } from '../../../typechain';

export type RegisterParams = [string, string];

export async function registerParams(
  registry: YellowClearingBase,
  participant: SignerWithAddress,
): Promise<RegisterParams> {
  return await getAndSignInteractionPayload(registry, participant);
}

export async function registerParamsFromPayload(
  participant: SignerWithAddress,
  interactionPayload: InteractionPayload,
): Promise<RegisterParams> {
  return [participant.address, await signInteractionPayload(interactionPayload, participant)];
}

export type MigrateParams = [string, string];

export async function migrateParams(
  registry: YellowClearingBase,
  participant: SignerWithAddress,
): Promise<MigrateParams> {
  return await getAndSignInteractionPayload(registry, participant);
}

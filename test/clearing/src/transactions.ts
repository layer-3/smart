import { getAndSignIdentityPayload, identityPayload, signIdentityPayload } from './identityPayload';

import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import type { YellowClearingBase } from '../../../typechain';

export type RegisterParams = [string, string];

export async function registerParams(
  registry: YellowClearingBase,
  participant: SignerWithAddress,
): Promise<RegisterParams> {
  return await getAndSignIdentityPayload(registry, participant);
}

export async function registerParamsFromPayload(
  participant: SignerWithAddress,
  identityPayload: identityPayload,
): Promise<RegisterParams> {
  return [participant.address, await signIdentityPayload(identityPayload, participant)];
}

export type MigrateParams = [string, string];

export async function migrateParams(
  registry: YellowClearingBase,
  participant: SignerWithAddress,
): Promise<MigrateParams> {
  return await getAndSignIdentityPayload(registry, participant);
}

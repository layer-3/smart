import { signSelf } from '../../../src/signatures';

import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export type registerParams = [string, string];

export async function registerParams(participant: SignerWithAddress): Promise<registerParams> {
  return [participant.address, await signSelf(participant)];
}

export type migrateParams = [string, string];

export async function migrateParams(participant: SignerWithAddress): Promise<migrateParams> {
  return [participant.address, await signSelf(participant)];
}

import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

import {encodeSelf} from '../signatures';

export type registerParams = [string, string];

export async function registerParams(participant: SignerWithAddress): Promise<registerParams> {
  return [participant.address, await encodeSelf(participant)];
}

export type migrateParams = [string, string];

export async function migrateParams(participant: SignerWithAddress): Promise<migrateParams> {
  return [participant.address, await encodeSelf(participant)];
}

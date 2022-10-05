import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {utils} from 'ethers';

import {signEncoded} from '../signatures';

export type registerParams = [string, string];

export async function registerParams(participant: SignerWithAddress): Promise<registerParams> {
  return [participant.address, await _encodeSelf(participant)];
}

export type migrateParams = [string, string];

export async function migrateParams(participant: SignerWithAddress): Promise<migrateParams> {
  return [participant.address, await _encodeSelf(participant)];
}

async function _encodeSelf(participant: SignerWithAddress): Promise<string> {
  return await signEncoded(
    participant,
    utils.defaultAbiCoder.encode(['address'], [participant.address])
  );
}

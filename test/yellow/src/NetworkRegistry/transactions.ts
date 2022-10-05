import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {utils} from 'ethers';

import {VaultProxyBase} from '../../../../typechain';
import {signEncoded} from '../signatures';

export type registerParams = [string, {vault: string; vaultBrokerSignature: string}];

export async function registerParams(
  participant: SignerWithAddress,
  vault: VaultProxyBase,
  broker: SignerWithAddress
): Promise<registerParams> {
  return [
    participant.address,
    {
      vault: vault.address,
      vaultBrokerSignature: await signEncoded(
        broker,
        utils.defaultAbiCoder.encode(['address'], [participant.address])
      ),
    },
  ];
}

export type migrateParams = [string, string];

export async function migrateParams(participant: SignerWithAddress): Promise<migrateParams> {
  return [
    participant.address,
    await signEncoded(
      participant,
      utils.defaultAbiCoder.encode(['address'], [participant.address])
    ),
  ];
}

import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {BigNumber, Wallet} from 'ethers';

import {YellowClearingBase} from '../../../../typechain';

export enum Status {
  None,
  Pending,
  Inactive,
  Active,
  Suspended,
  Migrated,
}

export function MockData(status: Status) {
  return {
    registrationTime: Date.now(),
    status: BigNumber.from(status),
    vault: Wallet.createRandom().address,
  };
}

export async function setParticipantStatus(
  registry: YellowClearingBase,
  participant: SignerWithAddress,
  status: Status
) {
  await registry.setParticipantData(participant.address, MockData(status));
}

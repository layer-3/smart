import { BigNumber } from 'ethers';

import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import type { YellowClearingBase } from '../../../typechain';

export enum Status {
  None,
  Pending,
  Inactive,
  Active,
  Suspended,
  Migrated,
}

export interface ParticipantData {
  status: BigNumber;
  nonce: number;
  registrationTime: number;
}

export function MockData(status: Status): ParticipantData {
  return {
    status: BigNumber.from(status),
    nonce: Math.round(Math.random() * 100),
    registrationTime: Date.now(),
  };
}

export async function setParticipantStatus(
  registry: YellowClearingBase,
  participant: SignerWithAddress,
  status: Status,
): Promise<void> {
  await registry.setParticipantData(participant.address, MockData(status));
}

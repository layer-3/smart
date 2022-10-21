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
  registrationTime: number;
  status: BigNumber;
}

export function MockData(status: Status): ParticipantData {
  return {
    registrationTime: Date.now(),
    status: BigNumber.from(status),
  };
}

export async function setParticipantStatus(
  registry: YellowClearingBase,
  participant: SignerWithAddress,
  status: Status,
): Promise<void> {
  await registry.setParticipantData(participant.address, MockData(status));
}

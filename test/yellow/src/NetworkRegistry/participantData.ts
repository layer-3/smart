import {BigNumber, Wallet} from 'ethers';

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
    status: BigNumber.from(status),
    vault: Wallet.createRandom().address,
    registrationTime: Date.now(),
  };
}

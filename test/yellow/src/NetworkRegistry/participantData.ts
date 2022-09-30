import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

const utils = ethers.utils;

export enum Status {
  None,
  Pending,
  Inactive,
  Active,
  Suspended,
  Migrated,
}

export function Data(status: Status, data: string) {
  return {
    status: BigNumber.from(status),
    data: utils.defaultAbiCoder.encode(['bytes32'], [utils.formatBytes32String(data)]),
  };
}

import {ethers} from 'hardhat';

// for contract to compile and be tested during this period
export const TIMESHIFT_SECONDS = 1800;

// vesting period of 30 days
export const VESTING_PERIOD_DAYS = 30;

// seconds in day
export const DAY = 60 * 60 * 24;

export async function getWillStart() {
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  const timestampBefore = blockBefore.timestamp;
  return timestampBefore + TIMESHIFT_SECONDS;
}

export function getWillEnd(willStart: number): number {
  return willStart + DAY * VESTING_PERIOD_DAYS;
}

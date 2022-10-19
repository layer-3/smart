import {ethers, upgrades} from 'hardhat';

import type {Vesting, VestingERC20} from '../../../typechain';

import {VESTING_PERIOD_DAYS} from './time';

export async function deployVesting(
  willStart: number,
  token: VestingERC20,
  cliff = 0,
  claimingInterval = 1,
): Promise<Vesting> {
  const VestingFactory = await ethers.getContractFactory('Vesting');
  const VestingContract = (await upgrades.deployProxy(VestingFactory, [
    token.address,
    willStart,
    VESTING_PERIOD_DAYS,
    cliff,
    claimingInterval,
  ])) as Vesting;
  await VestingContract.deployed();
  return VestingContract;
}

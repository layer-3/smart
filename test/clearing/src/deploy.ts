import type {Signer} from 'ethers';
import {ethers} from 'hardhat';

import type {YellowClearingBase} from '../../../typechain';

const AddressZero = ethers.constants.AddressZero;

export async function deployRegistry(
  version: number,
  signer?: Signer,
): Promise<YellowClearingBase> {
  return _deployRegistry(version, { signer });
}

export async function deployNextRegistry(
  version: number,
  prevImpl: YellowClearingBase,
  signer?: Signer,
) {
  return _deployRegistry(version, {prevImpl, signer});
}

interface DeployRegistryOptions {
  prevImpl?: YellowClearingBase;
  signer?: Signer;
  prevCallback?: (_: YellowClearingBase) => void;
  thisCallback?: (_: YellowClearingBase) => void;
}

export async function deployAndLinkNextRegistry(
  version: number,
  prevImpl: YellowClearingBase,
  signer?: Signer,
) {
  return _deployRegistry(version, {
    prevImpl,
    signer,
    callback: async (PrevRegistry: YellowClearingBase, NextRegistry: YellowClearingBase) => {
      await PrevRegistry.setNextImplementation(NextRegistry.address);
    },
  });
}

interface DeployRegistryOptions {
  prevImpl?: YellowClearingBase;
  signer?: Signer;
  prevRegCallback?: (PrevRegistry: YellowClearingBase) => unknown;
  thisRegCallback?: (NextRegistry: YellowClearingBase) => unknown;
  callback?: (PrevRegistry: YellowClearingBase, NextRegistry: YellowClearingBase) => unknown;
}

async function _deployRegistry(
  version: number,
  options: DeployRegistryOptions,
): Promise<YellowClearingBase> {
  const {prevImpl, signer, prevRegCallback, thisRegCallback, callback} = options;

  const prevImplAddress = prevImpl ? prevImpl.address : AddressZero;
  const RegistryFactory = await ethers.getContractFactory(`TESTYellowClearingV${version}`, signer);
  const NextRegistry = (await RegistryFactory.deploy(prevImplAddress)) as YellowClearingBase;
  await NextRegistry.deployed();

  if (prevImpl && prevRegCallback) {
    await prevRegCallback(prevImpl);
  }

  if (thisRegCallback) {
    await thisRegCallback(NextRegistry);
  }

  if (prevImpl && callback) {
    await callback(prevImpl, NextRegistry);
  }

  return NextRegistry;
}

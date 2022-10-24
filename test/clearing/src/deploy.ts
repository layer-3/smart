import { ethers } from 'hardhat';

import type { Signer } from 'ethers';
import type { YellowClearingBase } from '../../../typechain';

const AddressZero = ethers.constants.AddressZero;

export async function deployRegistry(version = 1, signer?: Signer): Promise<YellowClearingBase> {
  return _deployRegistry(version, { signer });
}

export async function deployNextRegistry(
  prevImpl: YellowClearingBase,
  version = 1,
  signer?: Signer,
): Promise<YellowClearingBase> {
  return _deployRegistry(version, { prevImpl, signer });
}

export async function deployAndLinkNextRegistry(
  prevImpl: YellowClearingBase,
  version = 1,
  signer?: Signer,
): Promise<YellowClearingBase> {
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
  prevCallback?: (PrevRegistry: YellowClearingBase) => unknown;
  thisCallback?: (NextRegistry: YellowClearingBase) => unknown;
  callback?: (PrevRegistry: YellowClearingBase, NextRegistry: YellowClearingBase) => unknown;
}

async function _deployRegistry(
  version: number,
  options: DeployRegistryOptions,
): Promise<YellowClearingBase> {
  const { prevImpl, signer, prevCallback, thisCallback, callback } = options;

  const prevImplAddress = prevImpl ? prevImpl.address : AddressZero;
  const RegistryFactory = await ethers.getContractFactory(`TESTYellowClearingV${version}`, signer);
  const NextRegistry = (await RegistryFactory.deploy(prevImplAddress)) as YellowClearingBase;
  await NextRegistry.deployed();

  if (prevImpl && prevCallback) {
    await prevCallback(prevImpl);
  }

  if (thisCallback) {
    await thisCallback(NextRegistry);
  }

  if (prevImpl && callback) {
    await callback(prevImpl, NextRegistry);
  }

  return NextRegistry;
}

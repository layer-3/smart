import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {Signer} from 'ethers';
import {ethers} from 'hardhat';
import { Address } from 'hardhat-deploy/dist/types';

import {YellowClearingBase} from '../../../../typechain';
import { MockData, Status } from './participantData';

const AddressZero = ethers.constants.AddressZero;

export async function deployRegistry(version: number, signer?: Signer) {
  return _deployRegistry(version, {signer});
}

export async function deployNextRegistry(
  version: number,
  prevImpl: YellowClearingBase,
  signer?: Signer
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
  signer?: Signer
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
  prevCallback?: (PrevRegistry: YellowClearingBase) => void;
  thisCallback?: (NextRegistry: YellowClearingBase) => void;
  callback?: (PrevRegistry: YellowClearingBase, NextRegistry: YellowClearingBase) => void;
}

async function _deployRegistry(
  version: number,
  options: DeployRegistryOptions
): Promise<YellowClearingBase> {
  const {prevImpl, signer, prevCallback, thisCallback, callback} = options;

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

export async function setParticipantStatus(
  registry: YellowClearingBase,
  participant: SignerWithAddress,
  status: Status
) {
  await registry.setParticipantData(participant.address, MockData(status));
}

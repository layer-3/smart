import {Signer} from 'ethers';
import {ethers} from 'hardhat';

import {YellowClearingBase} from '../../../../typechain';

const AddressZero = ethers.constants.AddressZero;

export async function deployRegistry(version: number, signer?: Signer) {
  return _deployRegistry(version, AddressZero, signer);
}

export async function deployNextRegistry(
  version: number,
  prevImplAddress: string,
  signer?: Signer
) {
  return _deployRegistry(version, prevImplAddress, signer);
}

async function _deployRegistry(
  version: number,
  prevImplAddress: string,
  signer?: Signer
): Promise<YellowClearingBase> {
  const _prevImplAddress = prevImplAddress ?? AddressZero;
  const RegistryFactory = await ethers.getContractFactory(`TESTYellowClearingV${version}`, signer);
  const Registry = (await RegistryFactory.deploy(_prevImplAddress)) as YellowClearingBase;
  await Registry.deployed();
  return Registry;
}

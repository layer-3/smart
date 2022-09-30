import {Signer} from 'ethers';
import {ethers} from 'hardhat';

import {YellowClearingBase} from '../../../../typechain';

export async function deployRegistry(
  version: number,
  signer?: Signer
): Promise<YellowClearingBase> {
  const RegistryFactory = await ethers.getContractFactory(`TESTYellowClearingV${version}`, signer);
  const Registry = (await RegistryFactory.deploy()) as YellowClearingBase;
  await Registry.deployed();
  return Registry;
}

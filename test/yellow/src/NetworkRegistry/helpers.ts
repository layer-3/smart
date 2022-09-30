import {ethers} from 'hardhat';

import {YellowClearingBase} from '../../../../typechain';

export async function deployRegistry(version: number): Promise<YellowClearingBase> {
  const RegistryFactory = await ethers.getContractFactory(`TESTYellowClearingV${version}`);
  const Registry = (await RegistryFactory.deploy(version)) as YellowClearingBase;
  await Registry.deployed();
  return Registry;
}

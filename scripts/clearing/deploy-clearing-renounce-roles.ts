import { isAddress } from 'ethers/lib/utils';
import { ethers } from 'hardhat';

import type { YellowClearingV1 } from '../../typechain';

async function main(): Promise<void> {
  const provider = ethers.provider;
  const network = await provider.getNetwork();
  console.log('Current network:', network.name);

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);
  const balanceBigNum = await deployer.getBalance();
  console.log('Deployer balance:', balanceBigNum.toString());

  // Fetch args
  const gnosisAddress = process.env.GNOSIS ?? undefined;
  if (!gnosisAddress || !isAddress(gnosisAddress)) {
    throw new Error(`Incorrect gnosis address: ${gnosisAddress ?? 'undefined'}`);
  }
  console.log('Gnosis address:', gnosisAddress, '\n');

  // Deploy Clearing
  const ClearingFactory = await ethers.getContractFactory('YellowClearingV1');
  const Clearing = (await ClearingFactory.deploy()) as YellowClearingV1;
  const { ...deployTransaction } = Clearing.deployTransaction;
  console.log('Transaction hash:', deployTransaction.hash);
  await Clearing.deployed();

  console.log('Deployed to:', Clearing.address, '\n');

  // Renounce roles
  const ADM_ROLE = ethers.constants.HashZero;
  const MNTR_ROLE = ethers.utils.id('REGISTRY_MAINTAINER_ROLE');

  await Clearing.grantRole(ADM_ROLE, gnosisAddress);
  console.log(`Granted 'DEFAULT_ADMIN_ROLE' to gnosis (${gnosisAddress})`);

  await Clearing.grantRole(MNTR_ROLE, gnosisAddress);
  console.log(`Granted 'REGISTRY_MAINTAINER_ROLE' to gnosis (${gnosisAddress})`);

  await Clearing.renounceRole(MNTR_ROLE, deployer.address);
  console.log(`Renounced 'REGISTRY_MAINTAINER_ROLE' from deployer (${deployer.address})`);

  await Clearing.renounceRole(ADM_ROLE, deployer.address);
  console.log(`Renounced 'DEFAULT_ADMIN_ROLE' from gnosis (${deployer.address})`);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}

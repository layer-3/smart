import { isAddress } from 'ethers/lib/utils';
import { ethers } from 'hardhat';

import type {VaultImplV1} from '../../typechain';

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

  // Deploy VaultImpl
  const VaultImplFactory = await ethers.getContractFactory('VaultImplV1');
  const VaultImpl = (await VaultImplFactory.deploy()) as VaultImplV1;
  const { ...deployTransaction } = VaultImpl.deployTransaction;
  console.log('Transaction hash:', deployTransaction.hash);
  await VaultImpl.deployed();

  console.log('Deployed to:', VaultImpl.address, '\n');

  // Renounce roles
  const ADM_ROLE = ethers.constants.HashZero;
  const MNTR_ROLE = ethers.utils.id('MAINTAINER_ROLE');

  await VaultImpl.grantRole(ADM_ROLE, gnosisAddress);
  console.log(`Granted 'DEFAULT_ADMIN_ROLE' to gnosis (${gnosisAddress})`);

  await VaultImpl.grantRole(MNTR_ROLE, gnosisAddress);
  console.log(`Granted 'MAINTAINER_ROLE' to gnosis (${gnosisAddress})`);

  await VaultImpl.renounceRole(MNTR_ROLE, deployer.address);
  console.log(`Renounced 'MAINTAINER_ROLE' from deployer (${deployer.address})`);

  await VaultImpl.renounceRole(ADM_ROLE, deployer.address);
  console.log(`Renounced 'DEFAULT_ADMIN_ROLE' from gnosis (${deployer.address})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { isAddress } from 'ethers/lib/utils';
import { ethers, upgrades } from 'hardhat';

import { requireEnv } from '../src/env';

async function main(): Promise<void> {
  const contractName = requireEnv<string>('CONTRACT', 'No contract name provided');

  const implAddress = requireEnv(
    'IMPL_ADDRESS',
    (address) => `Incorrect address: ${address ?? 'undefined'} provided`,
    isAddress,
  );

  console.log('Contract name:', contractName);
  console.log('Implementation address:', implAddress);

  const vaultFactory = await ethers.getContractFactory(contractName);

  const v2Contract = await upgrades.upgradeProxy(implAddress, vaultFactory);
  await v2Contract.deployed();

  console.log(`${contractName} upgraded on:`, v2Contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers, upgrades } from 'hardhat';

import { requireEnv } from '../src/env';
import { logTxHashesOrAddresses } from '../src/logging';

async function main(): Promise<void> {
  const contractName = requireEnv<string>('CONTRACT', 'No contract name provided!');

  console.log('Contract name:', contractName);

  let args: unknown[] = [];
  if (process.env.CONTRACT_ARGS) {
    args = process.env.CONTRACT_ARGS.split(',').map((v) => v.trim());
    console.log(`Args:`, args);
  }

  const factory = await ethers.getContractFactory(contractName);
  const contract = await upgrades.deployProxy(factory, args, {
    initializer: 'init',
  });
  const { ...deployTransaction } = contract.deployTransaction;
  await contract.deployed();

  await logTxHashesOrAddresses([
    ['Transaction hash', deployTransaction.hash],
    [`${contractName} address`, contract.address],
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

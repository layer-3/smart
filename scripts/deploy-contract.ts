import { ethers } from 'hardhat';

import {
  SEPARATOR,
  estimateAndLogDeploymentFees,
  logEnvironment,
  logTxHashesOrAddresses,
} from '../src/logging';
import { requireEnv } from '../src/env';

import type { Contract } from 'ethers';

async function main(): Promise<void> {
  const contractName = requireEnv<string>('CONTRACT', 'No contract name provided!');

  console.log('Contract name:', contractName);

  let args: unknown[] = [];
  if (process.env.CONTRACT_ARGS) {
    args = process.env.CONTRACT_ARGS.split(',').map((v) => v.trim());
    console.log(`Args:`, args);
  }

  await logEnvironment();

  const factory = await ethers.getContractFactory(contractName);

  let contract: Contract | undefined;
  let reverted = false;

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    contract = await factory.deploy(...args);
  } catch (error) {
    if ((error as { code: string }).code === 'INSUFFICIENT_FUNDS') {
      reverted = true;
    } else {
      throw error;
    }
  }

  if (reverted || process.env.ESTIMATE) {
    await estimateAndLogDeploymentFees(factory, args);
    console.log(SEPARATOR);

    if (reverted) {
      console.log(
        'ERROR: insufficient funds. Top up the account for at least estimated amount and try again.',
      );
    }
  }

  if (!reverted && contract) {
    const { ...deployTransaction } = contract.deployTransaction;

    await contract.deployed();

    await logTxHashesOrAddresses([
      ['Transaction hash', deployTransaction.hash],
      [`${contractName} address`, contract.address],
    ]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from 'hardhat';

import {
  SEPARATOR,
  estimateAndLogDeploymentFees,
  logEnvironment,
  logTxHashOrAddress,
} from '../src/logging';

import type { Contract } from 'ethers';

async function main(): Promise<void> {
  await logEnvironment();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let args: any[] = [];
  if (process.env.CONTRACT_ARGS) {
    args = process.env.CONTRACT_ARGS.split(',').map((v) => v.trim());
    console.log(`Args:`, args);
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const factory = await ethers.getContractFactory(process.env.CONTRACT_FACTORY!);

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

    await logTxHashOrAddress(['Transaction hash:', deployTransaction.hash]);

    await contract.deployed();

    await logTxHashOrAddress([`Deployed to:`, contract.address]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from 'hardhat';

import { GAS_TRACKER_SUPPORTED_NETWORKS, deploymentFees, transactionFees } from './gas-estimation';
import { getNetworkName } from './networks';

import type { Contract, ContractFactory } from 'ethers';

interface LogOptions {
  network?: boolean;
  deployerAddress?: boolean;
  deployerBalance?: boolean;
}

const defaultLogOptions: LogOptions = {
  network: true,
  deployerAddress: true,
  deployerBalance: true,
};

export async function logEnvironment(lo: LogOptions = defaultLogOptions): Promise<void> {
  if (lo.network) {
    const network = await ethers.provider.getNetwork();
    console.log('Current network:', network.name);
  }

  const [deployer] = await ethers.getSigners();

  if (lo.deployerAddress) {
    console.log('Deployer address:', deployer.address);
  }

  if (lo.deployerBalance) {
    const balanceBigNum = await deployer.getBalance();
    console.log('Deployer balance:', balanceBigNum.toString());
  }
}

async function logGasFees(estimated: number): Promise<void> {
  let noteMsg = '';

  if (!GAS_TRACKER_SUPPORTED_NETWORKS.has(await getNetworkName())) {
    noteMsg = `(rough estimation, 60% of gasAmount * maxFeePerGas)`;
  }

  console.log(`Estimated to consume ${estimated} gas`, noteMsg);
}

export async function estimateAndLogTransactionFees(
  contract: Contract,
  method_name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[],
): Promise<void> {
  const estimated = await transactionFees(contract, method_name, args);
  await logGasFees(estimated);
}

export async function estimateAndLogDeploymentFees(
  factory: ContractFactory,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[],
): Promise<void> {
  const estimated = await deploymentFees(factory, args);
  await logGasFees(estimated);
}

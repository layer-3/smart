import { providers } from 'ethers';
import { ethers } from 'hardhat';

import { getNetworkName } from './networks';

import type { Contract, ContractFactory } from 'ethers';

// Etherscan JSON-RPC API supports gas tracker endpoint on this networks
export const GAS_TRACKER_SUPPORTED_NETWORKS = new Set(['homestead', 'matic']);

// usual actual to max fee per gas ratio
export const ACTUAL_TO_MAX_FEE_RATIO = 0.6;

export async function estimateFeePerGas(): Promise<number> {
  // get network
  const networkName = await getNetworkName();

  if (GAS_TRACKER_SUPPORTED_NETWORKS.has(networkName)) {
    // create etherscan (with either provided api key or default shared one)
    const etherscan = new providers.EtherscanProvider(networkName);

    // get data from fee oracle
    const gasData = (await etherscan.fetch('gastracker', {
      action: 'gasoracle',
    })) as { ProposedGasPrice: string };

    return Number.parseFloat(gasData.ProposedGasPrice);
  } else {
    // get offline fee data
    const { maxFeePerGas } = await ethers.provider.getFeeData();

    // check data exist
    if (!maxFeePerGas) {
      throw new Error('Estimation failed: maxFeePerGas is null');
    }

    return ACTUAL_TO_MAX_FEE_RATIO * maxFeePerGas.toNumber();
  }
}

export async function transactionFees(
  contract: Contract,
  method_name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[],
): Promise<number> {
  const gasUsed = (await contract.estimateGas[method_name](args)).toNumber();

  const feePerGas = await estimateFeePerGas();

  return gasUsed * feePerGas;
}

export async function deploymentFees(
  factory: ContractFactory,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[],
): Promise<number> {
  const gasUsed = (
    await ethers.provider.estimateGas(factory.getDeployTransaction(args))
  ).toNumber();

  const feePerGas = await estimateFeePerGas();

  return gasUsed * feePerGas;
}

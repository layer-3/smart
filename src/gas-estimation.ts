import { BigNumber, providers, utils } from 'ethers';
import { ethers } from 'hardhat';

import { getNetworkName } from './networks';

import type { Contract, ContractFactory } from 'ethers';

// Etherscan JSON-RPC API supports gas tracker endpoint on this networks
export const GAS_TRACKER_SUPPORTED_NETWORKS = new Set(['homestead', 'matic']);

// usual actual to max fee per gas ratio
export const ACTUAL_TO_MAX_FEE_RATIO = 0.6;

function maxToActualFee(max: BigNumber): BigNumber {
  return max.mul(ACTUAL_TO_MAX_FEE_RATIO * 100).div(100);
}

export async function estimateFeePerGas(): Promise<BigNumber> {
  // get network
  const networkName = await getNetworkName();

  if (GAS_TRACKER_SUPPORTED_NETWORKS.has(networkName)) {
    // create etherscan (with either provided api key or default shared one)
    const etherscan = new providers.EtherscanProvider(networkName);

    // get data from fee oracle
    const gasData = (await etherscan.fetch('gastracker', {
      action: 'gasoracle',
    })) as { ProposeGasPrice: string };

    if (!gasData.ProposeGasPrice) {
      throw new Error('Estimation failed: ProposedGasPrice is undefined');
    }

    // TODO: support for networks other than ethereum, polygon and testnets
    return utils.parseUnits(gasData.ProposeGasPrice, 'gwei');
  } else {
    // get offline fee data
    const { maxFeePerGas } = await ethers.provider.getFeeData();

    // check data exist
    if (!maxFeePerGas) {
      throw new Error('Estimation failed: maxFeePerGas is null');
    }

    return maxToActualFee(maxFeePerGas);
  }
}

export async function transactionFees(
  contract: Contract,
  method_name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[],
): Promise<BigNumber> {
  const gasUsed = await contract.estimateGas[method_name](args);

  const feePerGas = await estimateFeePerGas();

  return gasUsed.mul(feePerGas);
}

export async function deploymentFees(
  factory: ContractFactory,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[],
): Promise<BigNumber> {
  const gasUsed = await ethers.provider.estimateGas(factory.getDeployTransaction(args));

  const feePerGas = await estimateFeePerGas();

  return gasUsed.mul(feePerGas);
}

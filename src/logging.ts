import { ethers } from 'hardhat';
import { Contract, ContractFactory, utils } from 'ethers';

import { GAS_TRACKER_SUPPORTED_NETWORKS, deploymentFees, transactionFees } from './gas-estimation';
import { getNetworkExplorerURL, getNetworkName } from './networks';

export const SEPARATOR = '\n-------------------\n';

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

  console.log(SEPARATOR);
}

async function logGasFees(estimated: number): Promise<void> {
  let noteMsg = '';

  if (!GAS_TRACKER_SUPPORTED_NETWORKS.has(await getNetworkName())) {
    noteMsg = `(rough estimation, 60% of gasAmount * maxFeePerGas)`;
  }

  console.log(
    `Estimated to consume ${utils.commify(estimated)} wei (${utils.commify(
      utils.formatUnits(estimated, 'gwei'),
    )} gwei)`,
  );

  if (noteMsg !== '') {
    console.log(noteMsg);
  }
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

// message, hash or address
type MessageAndHashOrAddress = [string, string];

function isHashOrAddress(hashOrAddress: string): 'tx' | 'address' {
  if (!ethers.utils.isHexString(hashOrAddress)) {
    throw new Error('Not a hex string');
  }

  switch (hashOrAddress.length) {
    case 42: {
      return 'address';
    }

    case 66: {
      return 'tx';
    }

    default: {
      throw new Error('Not a hash or address');
    }
  }
}

async function _getExplorerURL(): Promise<string> {
  let explorerURL = '';

  try {
    explorerURL = getNetworkExplorerURL(await getNetworkName());
  } catch (error) {
    if ((error as Error).cause !== 404) {
      throw error;
    }
  }

  return explorerURL;
}

function _logTxHashOrAddress(msgAndHshOrAddr: MessageAndHashOrAddress, explorerURL: string): void {
  console.log(msgAndHshOrAddr[0], msgAndHshOrAddr[1]);

  if (explorerURL !== '') {
    const hshOrAddr = isHashOrAddress(msgAndHshOrAddr[1]);
    console.log(`(${explorerURL}/${hshOrAddr}/${msgAndHshOrAddr[1]})`);
  }

  console.log();
}

export async function logTxHashOrAddress(
  messageAndHashOrAddress: MessageAndHashOrAddress,
): Promise<void> {
  const explorerURL = await _getExplorerURL();

  _logTxHashOrAddress(messageAndHashOrAddress, explorerURL);
}

export async function logTxHashesOrAddresses(
  messagesAndHashesOrAddresses: MessageAndHashOrAddress[],
): Promise<void> {
  const explorerURL = await _getExplorerURL();

  for (const msgAndHshOrAddr of messagesAndHashesOrAddresses) {
    _logTxHashOrAddress(msgAndHshOrAddr, explorerURL);
  }
}

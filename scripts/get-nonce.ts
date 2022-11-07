import { isAddress } from 'ethers/lib/utils';
import { ethers } from 'hardhat';

import { requireEnv } from '../src/env';
import { logEnvironment, logTxHashOrAddress } from '../src/logging';

async function main(): Promise<void> {
  const address = requireEnv<string>(
    'ADDRESS',
    (address) => `Incorrect address: ${address ?? 'undefined'} provided`,
    isAddress,
  );

  await logTxHashOrAddress(['Address:', address]);

  await logEnvironment();

  const [latest, pending] = await Promise.all([
    ethers.provider.getTransactionCount(address, 'latest'),
    ethers.provider.getTransactionCount(address, 'pending'),
  ]);

  console.log(`Nonce:`, { latest, pending });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from 'hardhat';

async function main(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const address = process.env.ADDRESS!;
  console.log(`address:`, address);

  const [latest, pending] = await Promise.all([
    ethers.provider.getTransactionCount(address, 'latest'),
    ethers.provider.getTransactionCount(address, 'pending'),
  ]);

  console.log(`nonce:`, { latest, pending });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

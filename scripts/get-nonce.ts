import {ethers} from 'hardhat';

async function main() {
  const [signer] = await ethers.getSigners()

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const address = process.env.ADDRESS ?? signer.address
  console.log(`address:`, address)

  const [latest, pending] = await Promise.all([
    ethers.provider.getTransactionCount(address, 'latest'),
    ethers.provider.getTransactionCount(address, 'pending'),
  ]);

  console.log(`nonce:`, {latest, pending});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

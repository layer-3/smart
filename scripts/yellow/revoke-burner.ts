import { ethers } from 'hardhat';

import type { Yellow } from '../../typechain';

async function main(): Promise<void> {
  const yellowAddress = process.env.YELLOW_ADDRESS ?? undefined;
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY ?? undefined;
  const account = process.env.ACCOUNT ?? undefined;

  if (!yellowAddress || !adminPrivateKey || !account) {
    throw new Error('Invalid arguments!');
  }

  console.log('Yellow address:', yellowAddress);
  console.log('Admin private key:', adminPrivateKey);
  console.log('Account:', account);

  const admin = new ethers.Wallet(adminPrivateKey, ethers.provider);

  const yellowFactory = await ethers.getContractFactory('Yellow');
  const yellowAttached = yellowFactory.attach(yellowAddress);
  const yellow = yellowAttached.connect(admin) as Yellow;

  try {
    await yellow.revokeRole(ethers.utils.id('BURNER_ROLE'), account);
  } catch (error) {
    console.error(error);
  }

  console.log(`BURNER_ROLE revoked from user with address ${account}'`);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}

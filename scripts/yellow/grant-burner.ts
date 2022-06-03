/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {ethers} from 'hardhat';

async function main() {
  const yellowAddress = process.env.YELLOW_ADDRESS!;
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY!;
  const account = process.env.ACCOUNT!;

  console.log('Yellow address:', yellowAddress);
  console.log('Admin private key:', adminPrivateKey);
  console.log('Account:', account);

  const admin = new ethers.Wallet(adminPrivateKey, ethers.provider);

  const yellowFactory = await ethers.getContractFactory('Yellow');
  const yellowAttached = await yellowFactory.attach(yellowAddress);
  const yellow = await yellowAttached.connect(admin);

  try {
    await yellow.grantRole(ethers.utils.id('BURNER_ROLE'), account);
  } catch (error) {
    console.error(error);
  }

  console.log(`Granted BURNER_ROLE to user with address ${account}'`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

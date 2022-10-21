import { ethers, upgrades } from 'hardhat';

async function main(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const contractName = process.env.CONTRACT_FACTORY!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const targetAddress = process.env.TARGET_ADDRESS!;

  console.log('contractName:', contractName);
  console.log('targetAddress:', targetAddress);

  const vaultFactory = await ethers.getContractFactory(contractName);

  const v2Contract = await upgrades.upgradeProxy(targetAddress, vaultFactory);
  await v2Contract.deployed();

  console.log(`${contractName} upgraded on:`, v2Contract.address);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}

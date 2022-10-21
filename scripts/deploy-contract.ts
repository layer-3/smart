import { ethers } from 'hardhat';

async function main(): Promise<void> {
  const provider = ethers.provider;
  const network = await provider.getNetwork();
  console.log('Current network:', network.name);

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);
  const balanceBigNum = await deployer.getBalance();
  console.log('Deployer balance:', balanceBigNum.toString());

  let args;
  if (process.env.CONTRACT_ARGS) {
    args = process.env.CONTRACT_ARGS.split(',').map((v) => v.trim());
    console.log(`Args:`, args);
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const factory = await ethers.getContractFactory(process.env.CONTRACT_FACTORY!);

  let contract;
  if (args) {
    contract = await factory.deploy(...args);
  } else {
    contract = await factory.deploy();
  }

  const { ...deployTransaction } = contract.deployTransaction;
  console.log('Transaction:', deployTransaction);
  await contract.deployed();

  console.log(`Deployed to:`, contract.address);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}

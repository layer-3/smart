import {ethers} from 'hardhat';

async function main() {
  const vaultName = 'SimpleVault';
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const brokerAddress = process.env.BROKER_ADDRESS!;
  console.log(`Broker address:`, brokerAddress);

  const vaultFactory = await ethers.getContractFactory('SimpleVault');
  const vaultContract = await vaultFactory.deploy(vaultName, brokerAddress);
  await vaultContract.deployed();

  console.log(`${vaultName} deployed to:`, vaultContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import {ethers, upgrades} from 'hardhat';

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const args = process.env.CONTRACT_ARGS!.split(',').map((v) => v.trim());
  console.log(`Args:`, args);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const factory = await ethers.getContractFactory(process.env.CONTRACT_FACTORY!);
  const contract = await upgrades.deployProxy(factory, args, {
    initializer: "init",
    timeout: 5 * 60 * 1000, // 5 mins
  })
  const deployTransaction = contract.deployTransaction
  console.log('transaction:', deployTransaction)
  await contract.deployed()

  console.log(`deployed to:`, contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import {ethers, upgrades} from 'hardhat';

// Usage:
// CONTRACT_ARGS=args,separated,by,commas npx hardhat run scripts/deploy-vesting --network <network name from hardhat.config.ts>
async function main() {
  const vestingName = 'Test Vesting';
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const args = process.env.CONTRACT_ARGS!.split(',').map((v) => v.trim());
  const [token, start, period, cliff, claiming_interval] = args;
  console.log(`Vesting token:`, token);
  console.log(`Vesting start:`, start);
  console.log(`Vesting period:`, period);
  console.log(`Vesting cliff:`, cliff);
  console.log(`Claiming interval:`, claiming_interval);

  const vestingFactory = await ethers.getContractFactory('Vesting');
  const vestingContract = await upgrades.deployProxy(vestingFactory, [
    token,
    start,
    period,
    cliff,
    claiming_interval,
  ]);
  await vestingContract.deployed();

  console.log(`${vestingName} deployed to:`, vestingContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

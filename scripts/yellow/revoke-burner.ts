import { isAddress } from 'ethers/lib/utils';
import hre, { ethers } from 'hardhat';

async function main(): Promise<void> {
  const revokeeAddress = process.env.REVOKEE ?? undefined;

  if (!revokeeAddress || !isAddress(revokeeAddress)) {
    throw new Error(`Incorrect revokee address: ${revokeeAddress ?? 'undefined'}`);
  }

  console.log('Revokee address:', revokeeAddress);

  const {
    deployments: { execute },
    getNamedAccounts,
  } = hre;

  const { deployer: admin } = await getNamedAccounts();

  await execute(
    'Yellow',
    { from: admin },
    'revokeRole',
    ethers.utils.id('BURNER_ROLE'),
    revokeeAddress,
  );

  console.log(`Revoked BURNER_ROLE from user with address ${revokeeAddress}'`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

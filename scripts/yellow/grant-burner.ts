import { isAddress } from 'ethers/lib/utils';
import hre, { ethers } from 'hardhat';

async function main(): Promise<void> {
  const granteeAddress = process.env.GRANTEE ?? undefined;

  if (!granteeAddress || !isAddress(granteeAddress)) {
    throw new Error(`Incorrect grantee address: ${granteeAddress ?? 'undefined'}`);
  }

  console.log('Grantee address:', granteeAddress);

  const {
    deployments: { execute },
    getNamedAccounts,
  } = hre;

  const { deployer: admin } = await getNamedAccounts();

  await execute(
    'Yellow',
    { from: admin },
    'grantRole',
    ethers.utils.id('BURNER_ROLE'),
    granteeAddress,
  );

  console.log(`Granted BURNER_ROLE to user with address ${granteeAddress}'`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

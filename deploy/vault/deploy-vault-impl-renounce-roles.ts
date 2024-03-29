import { isAddress } from 'ethers/lib/utils';

import { grantRenounceRolesAndLog } from '../helpers';
import { requireEnv } from '../../src/env';

import type { DeployFunction } from 'hardhat-deploy/dist/types';
import type { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre;

  const { deployer } = await getNamedAccounts();

  // Fetch args
  const granteeAddress = requireEnv(
    'GRANTEE',
    (address) => `Incorrect grantee address: ${address ?? 'undefined'} provided`,
    isAddress,
  );
  console.log('Grantee address:', granteeAddress);

  // deploy vault from script
  await deployments.run('vault');

  // grant and renounce roles on contract
  await grantRenounceRolesAndLog('VaultImplV1', [granteeAddress], deployer, [
    'DEFAULT_ADMIN_ROLE',
    'REGISTRY_MAINTAINER_ROLE',
  ]);
};
export default func;
func.tags = ['vault-impl-renounce-roles'];

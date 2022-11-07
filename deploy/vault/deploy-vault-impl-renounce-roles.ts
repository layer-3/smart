import { isAddress } from 'ethers/lib/utils';

import { logEnvironment, logTxHashesOrAddresses } from '../../src/logging';
import { grantRenounceRolesAndLog, tryDeployAndLog } from '../helpers';

import type { DeployFunction } from 'hardhat-deploy/dist/types';
import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import type { AccessControl } from '../../typechain';

const CONTRACT_NAME = 'VaultImplV1';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre;

  const { deployer } = await getNamedAccounts();

  // Fetch args
  const granteeAddress = process.env.GRANTEE ?? undefined;
  if (!granteeAddress || !isAddress(granteeAddress)) {
    throw new Error(`Incorrect grantee address: ${granteeAddress ?? 'undefined'}`);
  }
  console.log('Grantee address:', granteeAddress);

  await logEnvironment();

  const [result, error] = await tryDeployAndLog(CONTRACT_NAME, { from: deployer });

  if (!error && result) {
    await grantRenounceRolesAndLog(result.contract as AccessControl, [granteeAddress], deployer, [
      'DEFAULT_ADMIN_ROLE',
      'REGISTRY_MAINTAINER_ROLE',
    ]);

    await logTxHashesOrAddresses([
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ['Transaction hash', result.transactionHash!],
      [`${CONTRACT_NAME} address`, result.address],
    ]);
  }
};
export default func;
func.tags = ['vault-impl-renounce-roles'];

import { Contract, ethers } from 'ethers';
import hre from 'hardhat';

import { SEPARATOR, estimateAndLogDeploymentFees } from '../src/logging';

import type { DeployOptions, DeployResult } from 'hardhat-deploy/types';

export async function grantRenounceRolesAndLog(
  contractName: string,
  grantees: string[],
  renouncer: string,
  roles: string[],
): Promise<void> {
  const {
    deployments: { execute },
  } = hre;

  console.log(SEPARATOR);

  for (const grantee of grantees) {
    for (const role of roles) {
      let roleId = '';
      if (role === 'DEFAULT_ADMIN_ROLE') {
        roleId = ethers.constants.HashZero;
      } else {
        roleId = ethers.utils.id(role);
      }

      await execute(contractName, { from: renouncer }, 'grantRole', roleId, grantee);
      console.log(`Granted ${role} to grantee (${grantee})`);
    }
  }

  for (const role of roles) {
    let roleId = '';
    if (role === 'DEFAULT_ADMIN_ROLE') {
      roleId = ethers.constants.HashZero;
    } else {
      roleId = ethers.utils.id(role);
    }

    await execute(contractName, { from: renouncer }, 'renounceRole', roleId, renouncer);
    console.log(`Renounced ${role} from renouncer (${renouncer})`);
  }
}

export async function tryDeployAndLog(
  contractName: string,
  options: DeployOptions,
): Promise<[(DeployResult & { contract: Contract }) | undefined, Error | undefined]> {
  const { deployments, ethers } = hre;

  let deployResult: DeployResult | undefined;
  let reverted = false;

  try {
    // NOTE: `hardhat-deploy` logs the error anyway, no way to suppress it (for now, see: https://github.com/wighawag/hardhat-deploy/issues/387)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    deployResult = await deployments.deploy(contractName, options);
  } catch (error) {
    if ((error as { code: string }).code === 'INSUFFICIENT_FUNDS') {
      reverted = true;
    } else {
      throw error;
    }
  }

  if (reverted) {
    await estimateAndLogDeploymentFees(contractName, []);
    console.log(SEPARATOR);

    console.log(
      'ERROR: insufficient funds. Top up the account for at least estimated amount and try again.',
    );
    return [undefined, new Error('Insufficient funds')];
  } else {
    return [
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      { contract: await ethers.getContract(contractName), ...deployResult! },
      undefined,
    ];
  }
}

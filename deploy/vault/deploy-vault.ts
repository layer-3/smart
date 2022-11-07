import { logEnvironment, logTxHashesOrAddresses } from '../../src/logging';
import { tryDeployAndLog } from '../helpers';

import type { DeployFunction } from 'hardhat-deploy/dist/types';
import type { HardhatRuntimeEnvironment } from 'hardhat/types';

const CONTRACT_NAME = 'VaultImplV1';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre;

  const { deployer } = await getNamedAccounts();

  // log network, deployer, etc.
  await logEnvironment();

  // deploy clearing
  const [result, error] = await tryDeployAndLog(CONTRACT_NAME, { from: deployer });

  if (!error && result) {
    await logTxHashesOrAddresses([
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ['Transaction hash', result.transactionHash!],
      [`${CONTRACT_NAME} address`, result.address],
    ]);
  }
};

export default func;
func.tags = ['vault'];
